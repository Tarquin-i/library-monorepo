import { createAccessControl } from 'better-auth/plugins/access';

// 当前权限页只使用用户列表和角色修改，Admin 插件权限也只开放这两项。
const adminStatements = {
  user: ['list', 'set-role'],
} as const;

export const adminAccessControl = createAccessControl(adminStatements);

const fullAdminRole = adminAccessControl.newRole(adminStatements);

// 图书管理员和读者暂不开放 Admin 插件的账号管理能力。
const noAdminRole = adminAccessControl.newRole({
  user: [],
});

export const adminPluginRoles = {
  admin: fullAdminRole,
  librarian: noAdminRole, // 自定义图书管理员角色
  reader: noAdminRole, // 自定义读者角色
};
