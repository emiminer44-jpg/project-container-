// Credenciales de acceso para funciones protegidas
export const VALID_USER = 'Rioestiba pdt';
export const VALID_PASS = '1793';

export const validateCredentials = (user, pass) => {
  return user.trim() === VALID_USER && pass.trim() === VALID_PASS;
};
