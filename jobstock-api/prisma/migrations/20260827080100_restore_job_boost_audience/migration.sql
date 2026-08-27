-- Restores the JOB_BOOST enum value that a prior migration added to the database
-- but was accidentally dropped from schema.prisma without a matching migration,
-- leaving the generated Prisma Client unable to deserialize existing rows.
ALTER TYPE "PackageAudience" ADD VALUE IF NOT EXISTS 'JOB_BOOST';
