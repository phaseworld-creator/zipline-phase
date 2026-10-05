/**
 * Auto-organize uploads into date-based folders (YYYY/MM/DD).
 * Returns the folder ID to attach to the upload, creating folders as needed.
 */
import { prisma } from '@/lib/db';

export async function getOrCreateDateFolder(userId: string): Promise<string> {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Year folder
  let yearFolder = await prisma.folder.findFirst({ where: { userId, name: year, parentId: null } });
  if (!yearFolder)
    yearFolder = await prisma.folder.create({ data: { userId, name: year } });

  // Month folder
  let monthFolder = await prisma.folder.findFirst({
    where: { userId, name: month, parentId: yearFolder.id },
  });
  if (!monthFolder)
    monthFolder = await prisma.folder.create({
      data: { userId, name: month, parentId: yearFolder.id },
    });

  // Day folder
  let dayFolder = await prisma.folder.findFirst({
    where: { userId, name: day, parentId: monthFolder.id },
  });
  if (!dayFolder)
    dayFolder = await prisma.folder.create({
      data: { userId, name: day, parentId: monthFolder.id },
    });

  return dayFolder.id;
}
