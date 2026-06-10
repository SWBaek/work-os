import prisma from '../utils/prisma';

export const connectOrCreateTags = (names?: string[]) => {
  const cleanNames = Array.from(new Set((names ?? []).map((name) => name.trim()).filter(Boolean)));
  return cleanNames.map((name) => ({
    where: { name },
    create: { name },
  }));
};

export const setTags = async (names?: string[]) => {
  if (names === undefined) {
    return undefined;
  }

  const cleanNames = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
  await Promise.all(
    cleanNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  return cleanNames.map((name) => ({ name }));
};

export const tagInclude = {
  select: {
    id: true,
    name: true,
    color: true,
  },
};
