-- DropForeignKey
ALTER TABLE "InvalidToken" DROP CONSTRAINT "InvalidToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "StaffApplication" DROP CONSTRAINT "StaffApplication_userId_fkey";

-- AddForeignKey
ALTER TABLE "InvalidToken" ADD CONSTRAINT "InvalidToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffApplication" ADD CONSTRAINT "StaffApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
