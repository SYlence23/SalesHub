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

        public FileController(IAmazonS3 s3Client, IConfiguration configuration)
        {
            _s3Client = s3Client;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<IActionResult> UploadFileAsync(IFormFile file, string? prefix, string bucketName = "saleshub-bucket-132831331335-eu-central-1-an")
        {
            var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, bucketName);
            if (!bucketExist) return NotFound($"Bucket {bucketName} does not exist");
            var fileKey = string.IsNullOrEmpty(prefix) ? file.FileName : $"{prefix.TrimEnd('/')}/{file.FileName}";
            var request = new PutObjectRequest()
            {
                BucketName = bucketName,
                Key = fileKey,
                InputStream = file.OpenReadStream()
            };
            request.Metadata.Add("Content-Type", file.ContentType);
            await _s3Client.PutObjectAsync(request);
            return Ok(new { message = "File successfuly uploaded", https = $"https://{bucketName}.s3.{_configuration["AWS:Region"]}.amazonaws.com/{fileKey}" });
        }
        [HttpGet]
        public async Task<IActionResult> GetAllFilesAsync(string? prefix, string bucketName = "saleshub-bucket-132831331335-eu-central-1-an")
        {
            var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, bucketName);
            if (!bucketExist) return NotFound($"Bucket {bucketName} does not exist");
            var request = new ListObjectsV2Request()
            {
                BucketName = bucketName,
                Prefix = prefix
            };
            var result = await _s3Client.ListObjectsV2Async(request);
            var s3Objectsj = result.S3Objects.Select(o =>
            {
                var urlRequest = new GetPreSignedUrlRequest()
                {
                    BucketName = bucketName,
                    Key = o.Key,
                    Expires = DateTime.UtcNow.AddMinutes(1)
                };
                return new S3ObjectDto()
                {
                    Name = o.Key.ToString(),
                    PresignedUrl = _s3Client.GetPreSignedURL(urlRequest)
                };
            });
            return Ok(s3Objectsj);
        }

        [HttpGet("preview")]
        public async Task<IActionResult> GetFileAsync(string key, string bucketName = "saleshub-bucket-132831331335-eu-central-1-an")
        {
            var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, bucketName);
            if (!bucketExist) return NotFound($"Bucket {bucketName} does not exist");
            var request = new GetObjectRequest()
            {
                BucketName = bucketName,
                Key = key
            };
            var result = await _s3Client.GetObjectAsync(request);
            return File(result.ResponseStream, result.Headers.ContentType, key);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteFileAsync(string? prefix, string bucketName = "saleshub-bucket-132831331335-eu-central-1-an")
        {
            var bucketExist = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, bucketName);
            if (!bucketExist) return NotFound($"Bucket {bucketName} does not exist");
            await _s3Client.DeleteObjectAsync(bucketName, prefix);
            return NoContent();
        }
    }
}
