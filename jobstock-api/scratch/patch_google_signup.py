import os

file_path = r'c:\Users\kisho\OneDrive\Desktop\jpr\JobPortal\jobstock-api\src\auth\auth.service.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_auth = """    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, authProvider: AuthProvider.GOOGLE },
        });
      } else {
        if (dto.isLogin) {
          throw new UnauthorizedException('Please sign up first to sign in to the account');
        }
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
    }"""

new_auth = """    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        if (dto.isLogin === false || dto.isLogin === undefined) {
          throw new ConflictException('You are already registered. Please log in.');
        }
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, authProvider: AuthProvider.GOOGLE },
        });
      } else {
        if (dto.isLogin) {
          throw new UnauthorizedException('Please sign up first to sign in to the account');
        }
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
    } else {
      if (dto.isLogin === false || dto.isLogin === undefined) {
        throw new ConflictException('You are already registered. Please log in.');
      }
    }"""

content = content.replace(old_auth, new_auth)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
