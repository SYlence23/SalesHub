using Amazon.S3;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace SalesHub.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BucketController : ControllerBase
    {
        private readonly IAmazonS3 _s3Client;

        public BucketController(IAmazonS3 s3Client)
        {
            _s3Client = s3Client;
        }

        [HttpPost("uploadimage")]
        public async Task<IActionResult> CreateBucketAsync([FromQuery] string bucketName)
        {
            var bucketExists = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, bucketName);
            if (bucketExists) return BadRequest($"Bucket '{bucketName}' already exists.");
            await _s3Client.PutBucketAsync(bucketName);
            return Created("buckets", $"bucket {bucketName} created.");
        }

        [HttpGet]
        public async Task<IActionResult> GetAllBucketsAsync()
        {
            var listBuckets = await _s3Client.ListBucketsAsync();
            var buckets = listBuckets.Buckets.Select(r => r.BucketName);
            return Ok(buckets);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteBucketAsynt([FromQuery] string bucketName)
        {
            await _s3Client.DeleteBucketAsync(bucketName);
            return NoContent();
        }
    }
}
