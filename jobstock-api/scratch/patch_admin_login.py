import os

file_path = r'c:\Users\kisho\OneDrive\Desktop\jpr\JobPortal\jobstock-api\src\auth\auth.service.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix googleAuth
old_google_check = """    if (dto.isLogin && dto.role && user.role !== dto.role) {
      throw new UnauthorizedException(`You are registered as a ${user.role}, please select the correct login type.`);
    }"""
    
new_google_check = """    if (dto.isLogin && dto.role && user.role !== dto.role && user.role !== Role.ADMIN) {
      throw new UnauthorizedException(`You are registered as a ${user.role}, please select the correct login type.`);
    }"""
    
content = content.replace(old_google_check, new_google_check)

# Fix login
old_login_check = """    if (dto.role && user.role !== dto.role) {
      throw new UnauthorizedException(`You are registered as a ${user.role}, please select the correct login type.`);
    }"""
    
new_login_check = """    if (dto.role && user.role !== dto.role && user.role !== Role.ADMIN) {
      throw new UnauthorizedException(`You are registered as a ${user.role}, please select the correct login type.`);
    }"""

content = content.replace(old_login_check, new_login_check)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
