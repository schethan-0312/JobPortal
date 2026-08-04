const fs = require('fs');

let content = fs.readFileSync('src/candidates/candidates.controller.ts', 'utf8');

const importLines = `
import { CreateEducationDto, CreateExperienceDto, CreateProjectDto, CreateCertificationDto } from './dto/resume.dto.js';
`;
content = content.replace("import { UpdateCandidateProfileDto }", importLines + "import { UpdateCandidateProfileDto }");

const controllerLines = `
  // ---- Resume APIs ----

  @Post('me/educations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  addEducation(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEducationDto) {
    return this.candidatesService.addEducation(user.userId, dto);
  }
  @Delete('me/educations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  removeEducation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.candidatesService.removeEducation(user.userId, id);
  }

  @Post('me/experiences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  addExperience(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExperienceDto) {
    return this.candidatesService.addExperience(user.userId, dto);
  }
  @Delete('me/experiences/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  removeExperience(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.candidatesService.removeExperience(user.userId, id);
  }

  @Post('me/projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  addProject(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) {
    return this.candidatesService.addProject(user.userId, dto);
  }
  @Delete('me/projects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  removeProject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.candidatesService.removeProject(user.userId, id);
  }

  @Post('me/certifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  addCertification(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCertificationDto) {
    return this.candidatesService.addCertification(user.userId, dto);
  }
  @Delete('me/certifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  removeCertification(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.candidatesService.removeCertification(user.userId, id);
  }
`;

content = content.replace("  @Get('saved-jobs')", controllerLines + "\n  @Get('saved-jobs')");
fs.writeFileSync('src/candidates/candidates.controller.ts', content);
