export const countries = [
  { code: 'BJ', flagUrl: 'https://flagcdn.com/w40/bj.png', name: 'Bénin', dialCode: '+229' },
  { code: 'CI', flagUrl: 'https://flagcdn.com/w40/ci.png', name: 'Côte d’Ivoire', dialCode: '+225' },
  { code: 'SN', flagUrl: 'https://flagcdn.com/w40/sn.png', name: 'Sénégal', dialCode: '+221' },
  { code: 'TG', flagUrl: 'https://flagcdn.com/w40/tg.png', name: 'Togo', dialCode: '+228' },
  { code: 'BF', flagUrl: 'https://flagcdn.com/w40/bf.png', name: 'Burkina Faso', dialCode: '+226' },
  { code: 'ML', flagUrl: 'https://flagcdn.com/w40/ml.png', name: 'Mali', dialCode: '+223' },
  { code: 'NE', flagUrl: 'https://flagcdn.com/w40/ne.png', name: 'Niger', dialCode: '+227' },
  { code: 'CM', flagUrl: 'https://flagcdn.com/w40/cm.png', name: 'Cameroun', dialCode: '+237' }
] as const;

export type Country = typeof countries[number];

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function buildInternationalPhone(dialCode: string, localNumber: string) {
  return `${dialCode}${digitsOnly(localNumber)}`;
}
