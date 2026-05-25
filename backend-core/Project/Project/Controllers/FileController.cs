using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SalesHub.DTOs;

namespace SalesHub.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private readonly IAmazonS3 _s3Client;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FileController> _logger;
        private readonly string _bucketName;

        public FileController(IAmazonS3 s3Client, IConfiguration configuration, ILogger<FileController> logger)
        {
            _s3Client = s3Client;
            _configuration = configuration;
            _logger = logger;
            _bucketName = _configuration["AWS:BucketName"] ?? "saleshub-bucket-239997294546";
        }

        [HttpPost("uploadImage")]
        public async Task<IActionResult> UploadFileAsync(IFormFile file, string? prefix, string? bucketName = null)
        {
            try
            {
                var targetBucket = string.IsNullOrEmpty(bucketName) ? _bucketName : bucketName;
                var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, targetBucket);
                if (!bucketExist) return NotFound($"Bucket {targetBucket} does not exist");
                
                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var fileKey = string.IsNullOrEmpty(prefix) ? uniqueFileName : $"{prefix.TrimEnd('/')}/{uniqueFileName}";
                
                var request = new PutObjectRequest()
                {
                    BucketName = targetBucket,
                    Key = fileKey,
                    InputStream = file.OpenReadStream()
                };
                request.Metadata.Add("Content-Type", file.ContentType);
                await _s3Client.PutObjectAsync(request);
                
                var localUrl = $"{Request.Scheme}://{Request.Host}/api/File/preview?key={Uri.EscapeDataString(fileKey)}";
                return Ok(new 
                { 
                    Message = "File successfuly uploaded", 
                    Url = localUrl,
                    FileName = uniqueFileName,
                    Prefix = prefix ?? string.Empty
                });
            }
            catch (Exception e)
            {
                _logger.LogWarning(e, "S3 upload failed. Falling back to local storage.");
                try
                {
                    var uploadsFolder = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", "images");
                    if (!System.IO.Directory.Exists(uploadsFolder)) 
                        System.IO.Directory.CreateDirectory(uploadsFolder);
                    
                    var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                    var filePath = System.IO.Path.Combine(uploadsFolder, uniqueFileName);
                    
                    using (var stream = new System.IO.FileStream(filePath, System.IO.FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                    
                    var localUrl = $"{Request.Scheme}://{Request.Host}/images/{uniqueFileName}";
                    return Ok(new 
                    { 
                        Message = "File successfully uploaded to local storage (S3 fallback)", 
                        Url = localUrl,
                        FileName = uniqueFileName,
                        Prefix = prefix ?? string.Empty
                    });
                }
                catch (Exception localEx)
                {
                    _logger.LogError(localEx, "Local fallback upload also failed.");
                    return StatusCode(500, "Failed to upload image both to S3 and local fallback.");
                }
            }
            
        }

        [HttpGet]
        public async Task<IActionResult> GetAllFilesAsync(string? prefix)
        {
            try
            {
                var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName);
                if (!bucketExist) return NotFound($"Bucket {_bucketName} does not exist");
                
                var request = new ListObjectsV2Request()
                {
                    BucketName = _bucketName,
                    Prefix = prefix
                };
                var result = await _s3Client.ListObjectsV2Async(request);
                var s3Objects = result.S3Objects.Select(o =>
                {
                    var urlRequest = new GetPreSignedUrlRequest()
                    {
                        BucketName = _bucketName,
                        Key = o.Key,
                        Expires = DateTime.UtcNow.AddMinutes(15)
                    };
                    return new S3ObjectDto()
                    {
                        Name = o.Key,
                        PresignedUrl = _s3Client.GetPreSignedURL(urlRequest)
                    };
                });
                return Ok(s3Objects);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error listing files from S3");
                return StatusCode(500, e.Message);
            }
        }

        [HttpGet("preview")]
        public async Task<IActionResult> GetFileAsync(string key)
        {
            try
            {
                var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName);
                if (!bucketExist) return NotFound($"Bucket {_bucketName} does not exist");
                
                var request = new GetObjectRequest()
                {
                    BucketName = _bucketName,
                    Key = key
                };
                var result = await _s3Client.GetObjectAsync(request);
                return File(result.ResponseStream, result.Headers.ContentType, key);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error getting file from S3");
                return StatusCode(500, e.Message);
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteFileAsync(string key)
        {
            try
            {
                var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName);
                if (!bucketExist) return NotFound($"Bucket {_bucketName} does not exist");
                
                await _s3Client.DeleteObjectAsync(_bucketName, key);
                return NoContent();
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error deleting file from S3");
                return StatusCode(500, e.Message);
            }
        }
    }
}
