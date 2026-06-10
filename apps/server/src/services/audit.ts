import prisma from '../utils/prisma';

export const recordAudit = async (
  entityType: string,
  entityId: string,
  action: 'Create' | 'Update' | 'Delete',
  changedFields: Record<string, unknown>,
) => {
  await prisma.auditLog.create({
    data: {
      entity_type: entityType,
      entity_id: entityId,
      action,
      changed_fields: JSON.stringify(changedFields),
    },
  });
};
