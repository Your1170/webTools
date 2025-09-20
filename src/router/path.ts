/**
 * PageLink用ファイル
 */

interface typePageLinks {
  name: string;
  path: string;
}

export const pageLinks: typePageLinks[] = [
  { name: 'Top', path:'/' },
  { name: 'パスワード作成', path:'/create_pass' },
  { name: 'ハッシュ化ツール', path:'/change_hash' },
];
