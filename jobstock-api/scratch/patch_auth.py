import os

file_path = r'c:\Users\kisho\OneDrive\Desktop\jpr\JobPortal\jobstock-api\src\auth\auth.service.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports_to_add = """import { OAuth2Client } from 'google-auth-library';
import { AuthProvider } from '../../generated/prisma/enums.js';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
"""
content = content.replace("import { RegisterDto } from './dto/register.dto.js';", imports_to_add + "import { RegisterDto } from './dto/register.dto.js';")

# Update login method
login_old = """  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }"""
login_new = """  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    if (!user.passwordHash) {
      throw new UnauthorizedException('Please login with your Google account');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }"""
content = content.replace(login_old, login_new)

# Update deleteAccount method
delete_old = """  async deleteAccount(userId: string, dto: import('./dto/delete-account.dto.js').DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new BadRequestException('Invalid password');"""
delete_new = """  async deleteAccount(userId: string, dto: import('./dto/delete-account.dto.js').DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.passwordHash) {
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isPasswordValid) throw new BadRequestException('Invalid password');
    }"""
content = content.replace(delete_old, delete_new)

# Update changePassword method
change_old = """  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }"""
change_new = """  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    if (user.passwordHash) {
      const currentMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!currentMatches) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }"""
content = content.replace(change_old, change_new)

google_auth_method = """

  async googleAuth(dto: GoogleAuthDto) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: dto.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    const { sub: googleId, email, name, email_verified } = payload;

    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, authProvider: AuthProvider.GOOGLE },
        });
      } else {
        const role = dto.role || Role.CANDIDATE;
        const isEmailVerified = email_verified || false;
        
        user = await this.prisma.user.create({
          data: {
            email,
            role,
            googleId,
            authProvider: AuthProvider.GOOGLE,
            isEmailVerified,
            ...(role === Role.CANDIDATE
              ? { candidateProfile: { create: { fullName: name || 'User' } } }
              : { employer: { create: { companyName: name || 'Company', location: 'Unknown' } } }),
          },
          include: { candidateProfile: true, employer: true },
        });

        await this.emailService.sendWelcomeEmail(email, name || 'User');
      }
    }

    const { passwordHash: _omit, emailVerifyToken: _omitToken, ...safeUser } = user;

    return {
      user: safeUser,
      ...this.issueTokens(user.id, user.email, user.role),
    };
  }
"""

content = content.replace("async login(dto: LoginDto) {", google_auth_method + "\n  async login(dto: LoginDto) {")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
