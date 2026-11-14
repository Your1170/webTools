/**
 * PageLink用ファイル
 */

export interface TypePageLinks {
  name: string;
  path: string;
  // SVG path の d 属性文字列（viewBox="0 0 24 24"）
  iconPath: string;
}

export const pageLinks: TypePageLinks[] = [
  {
    name: 'Top',
    path: '/',
    // Home icon
    iconPath: 'M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5zM9 21V12h6v9',
  },
  {
    name: 'パスワード作成',
    path: '/create_pass',
    // Key icon
    iconPath: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
  },
  {
    name: 'HTML GAME STUDIO',
    path: '/html_game_studio',
    // Code / terminal icon
    iconPath: 'M16 18l6-6-6-6M8 6L2 12l6 6',
  },
  {
    name: '画像変換',
    path: '/image_converter',
    // Image / picture icon
    iconPath: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z',
  },
  {
    name: 'ハッシュ化ツール',
    path: '/change_hash',
    // Hash / fingerprint icon
    iconPath: 'M4 7h16M4 12h16M4 17h16M9 3v18M15 3v18',
  },
];
