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
        public async Task<IActionResult> UploadFileAsync(IFormFile file, string? prefix)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File is empty");

            try
            {
                var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName);
                if (!bucketExist) 
                {
                    _logger.LogError("S3 Bucket {BucketName} does not exist", _bucketName);
                    return NotFound($"Bucket {_bucketName} does not exist");
                }
                
                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var cleanPrefix = prefix?.Trim('/') ?? "";
                var fileKey = string.IsNullOrEmpty(cleanPrefix) ? uniqueFileName : $"{cleanPrefix}/{uniqueFileName}";
                
                using var stream = file.OpenReadStream();
                var request = new PutObjectRequest()
                {
                    BucketName = _bucketName,
                    Key = fileKey,
                    InputStream = stream,
                    ContentType = file.ContentType,
                    CannedACL = S3CannedACL.PublicRead
                };
                
                await _s3Client.PutObjectAsync(request);
                
                var region = _configuration["AWS:Region"] ?? "eu-central-1";
                var url = $"https://{_bucketName}.s3.{region}.amazonaws.com/{fileKey}";
                
                _logger.LogInformation("File uploaded successfully to S3: {Url}", url);
                
                return Ok(new 
                { 
                    Message = "File successfully uploaded", 
                    Url = url,
                    FileName = uniqueFileName,
                    Prefix = cleanPrefix
                });
            }
            catch (AmazonS3Exception e)
            {
                _logger.LogError(e, "Amazon S3 error during upload");
                return StatusCode((int)e.StatusCode, $"S3 Error: {e.Message}");
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Unexpected error during file upload");
                return StatusCode(500, $"Internal error: {e.Message}");
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
