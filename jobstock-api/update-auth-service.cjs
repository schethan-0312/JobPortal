const fs = require('fs');
let content = fs.readFileSync('src/auth/auth.service.ts', 'utf8');

const newMethod = \
  async updateProfilePhoto(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhotoUrl: avatarUrl }
    });
    return { success: true, profilePhotoUrl: user.profilePhotoUrl };
  }
\;

content = content.replace('async forgotPassword(email: string) {', newMethod + '\\n  async forgotPassword(email: string) {');
fs.writeFileSync('src/auth/auth.service.ts', content);
