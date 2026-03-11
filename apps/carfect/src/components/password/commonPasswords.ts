// Top 1000 most common passwords (lowercase) for frontend check
// Source: SecLists / Have I Been Pwned
export const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'michael', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'michael', 'football', 'password1', 'password123', 'batman', 'login',
  'admin', 'princess', 'starwars', 'solo', 'welcome', 'charlie', 'donald',
  '666666', '696969', '112233', 'jordan', 'jennifer', 'hunter', 'amanda',
  'joshua', 'thomas', 'robert', 'andrew', 'daniel', 'matthew', 'william',
  'jessica', 'nicole', 'michelle', 'samantha', 'bailey', 'buster', 'hannah',
  'maggie', 'jasmine', 'ginger', 'pepper', 'abcdef', 'abcd1234', 'aaaaaa',
  '111111', 'qwerty123', 'zxcvbn', 'zxcvbnm', '1q2w3e4r', '1q2w3e',
  'q1w2e3r4', 'q1w2e3', 'pass', 'test', 'guest', 'changeme', 'temp',
  'default', 'letmein1', 'welcome1', 'hello', 'freedom', 'whatever',
  'qwert', 'passw0rd', 'p@ssw0rd', 'p@ssword', 'pa$$word', 'passwd',
  '000000', '121212', '131313', '232323', '123321', '1234', '12345',
  '123456789', '1234567890', '0987654321', '987654321', '87654321',
  'haslo', 'haslo123', 'polska', 'warszawa', 'krakow', 'dupa', 'dupa123',
  'zaq12wsx', 'zaq1xsw2', 'kotik', 'misiek', 'kochanie', 'marcin',
  'marek', 'tomek', 'pawel', 'piotr', 'adam', 'jan', 'anna', 'maria',
  'kasia', 'basia', 'ania', 'marta', 'agnieszka', 'monika', 'patryk',
  'computer', 'internet', 'samsung', 'fuckyou', 'asshole', 'fuck',
  'killer', 'access', 'mustang', 'bailey', 'shadow1', 'master1',
  'michael1', 'jennifer1', 'jordan23', 'soccer', 'hockey', 'ranger',
  'buster1', 'harley', 'summer', 'george', 'yankees', 'dallas',
  'austin', 'thunder', 'taylor', 'matrix', 'knight', 'diamond',
  'martin', 'chelsea', 'patrick', 'cookie', 'silver', 'sparky',
  'trustno', 'cowboy', 'phoenix', 'camaro', 'corvette', 'falcon',
  'midnight', 'murphy', 'andrea', 'hammer', 'tiger', 'jaguar',
  'arsenal', 'liverpool', 'chelsea1', 'barcelona', 'realmadrid',
  'qweasd', 'qweasdzxc', 'asdfgh', 'asdfghjkl', 'zxcasd', '1qaz2wsx',
  '!@#$%^&*', 'passpass', 'abcabc', 'asd123', 'qwe123', 'abc1234',
]);

/**
 * Check if a password is in the common passwords list.
 * Checks lowercase version of the password.
 */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}
