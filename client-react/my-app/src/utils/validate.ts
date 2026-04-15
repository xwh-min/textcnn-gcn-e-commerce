// 校验邮箱
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// 校验手机号
export const validatePhone = (phone: string): boolean => {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
};

// 校验密码强度
export const validatePassword = (password: string): boolean => {
  // 至少8位，包含字母和数字
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return regex.test(password);
};

// 校验身份证号
export const validateIdCard = (idCard: string): boolean => {
  const regex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  return regex.test(idCard);
};

// 校验企业代码
export const validateCompanyCode = (code: string): boolean => {
  // 统一社会信用代码
  const regex = /^[A-Z0-9]{18}$/;
  return regex.test(code);
};