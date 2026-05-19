using Microsoft.AspNetCore.Identity;
using SalesHub.Models;
using SalesHub.DTOs;
using SalesHub.Enums;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace SalesHub.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<(bool Succeeded, string Message)> RegisterAsync(RegisterDto model)
        {
            var userExists = await _userManager.FindByEmailAsync(model.Email);

            if (userExists != null)
                return (false, "User with this email already exists.");

            ApplicationUser user = new()
            {
                Email = model.Email,
                SecurityStamp = Guid.NewGuid().ToString(),
                UserName = model.Email,
                Name = model.Name,
                Surname = model.Surname,
                Category = model.IsStudent ? UserCategories.Student : UserCategories.NonStudent
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return (false, "User creation failed. Please check the details and try again.");

            await _userManager.AddToRoleAsync(user, "User");

            return (true, "User registered successfully.");
        }

        public async Task<TokenDto?> LoginAsync(LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
            {
                var userRoles = await _userManager.GetRolesAsync(user);

                var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.UserName),
                    new Claim("firstName", user.Name ?? string.Empty),
                    new Claim("lastName", user.Surname ?? string.Empty),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                };
                foreach (var userRole in userRoles)
                {
                    authClaims.Add(new Claim(ClaimTypes.Role, userRole));
                }

                var token = CreateToken(authClaims);

                return new TokenDto
                {
                    AccessToken = new JwtSecurityTokenHandler().WriteToken(token)
                };
            }

            return null;
        }

        private JwtSecurityToken CreateToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            _ = int.TryParse(_configuration["Jwt:TokenValidityInMinutes"], out int tokenValidityInMinutes);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.UtcNow.AddMinutes(tokenValidityInMinutes),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return token;
        }
    }
}
