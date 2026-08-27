import os

file_path = r'c:\Users\kisho\OneDrive\Desktop\jpr\JobPortal\jobstock-api\src\auth\auth.service.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

google_auth_old = """  async googleAuth(dto: GoogleAuthDto) {
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
  }"""

google_auth_new = """  async googleAuth(dto: GoogleAuthDto) {
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
    }

    if (dto.isLogin && dto.role && user.role !== dto.role) {
      throw new UnauthorizedException(`You are registered as a ${user.role}, please select the correct login type.`);
    }

    const { passwordHash: _omit, emailVerifyToken: _omitToken, ...safeUser } = user;

    return {
      user: safeUser,
      ...this.issueTokens(user.id, user.email, user.role),
    };
  }"""

content = content.replace(google_auth_old, google_auth_new)


login_old = """  async login(dto: LoginDto) {
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
    }

    const { passwordHash: _omit, ...safeUser } = user;

    return {
      user: safeUser,
      ...this.issueTokens(user.id, user.email, user.role),
    };
  }"""

login_new = """  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    if (dto.role && user.role !== dto.role) {
      throw new UnauthorizedException(`You are registered as a ${user.role}, please select the correct login type.`);
    }
    
    if (!user.passwordHash) {
      throw new UnauthorizedException('Please login with your Google account');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { passwordHash: _omit, ...safeUser } = user;

    return {
      user: safeUser,
      ...this.issueTokens(user.id, user.email, user.role),
    };
  }"""

content = content.replace(login_old, login_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
