(() => {
  const raw = [
    ['vibecode', '#0e0e14', '#17171f', '#4c4c63', '#e6e6f0', '#a78bfa', '#5eead4', '#fb7185', '#9f4a5a'],
    ['studio dark', '#1d1f23', '#26292e', '#5f6670', '#e4e7eb', '#00a2ff', '#00a2ff', '#ff5f5f', '#a33d3d'],
    ['studio light', '#f3f4f6', '#e2e5ea', '#9aa2ad', '#23272e', '#0079d9', '#0079d9', '#d93f3f', '#9e2d2d'],
    ['noob', '#1a4a8c', '#163f78', '#7097c8', '#f4f1e6', '#f5cd30', '#a4c639', '#ff8a8a', '#c46a6a'],
    ['baseplate', '#d6d7d9', '#c6c8cb', '#8b8e93', '#2a2c30', '#3b7ddd', '#2a2c30', '#d64545', '#9c3434'],
    ['robux gold', '#121c16', '#1a281f', '#4d6b58', '#e6f2e9', '#f2c14e', '#f2c14e', '#ff6b5b', '#a4473d'],
    ['lava obby', '#170d0b', '#251412', '#74463a', '#ffe4d6', '#ff6a2a', '#ffb02e', '#ff3d6e', '#a62b4b'],
    ['ice obby', '#e8f3fa', '#d4e7f3', '#8fb0c6', '#1e3a4c', '#1d9bd7', '#1e3a4c', '#e0526a', '#a63a4c'],
    ['neon night', '#0b0a1a', '#15132b', '#4a4378', '#ebe7ff', '#ff4fd8', '#41f2ff', '#ff5c7a', '#a63b52'],
    ['classic 2008', '#f5f5f5', '#e3e3e3', '#a0a0a0', '#1d1d1d', '#0b62c4', '#0b62c4', '#e3241b', '#9e1a14'],
    ['grassland', '#1f2e19', '#283a20', '#66834f', '#eff6e7', '#94d64a', '#d3f27e', '#ff7f5c', '#a8533c'],
    ['bloxy cola', '#1c0a0c', '#2b1013', '#7a3a41', '#ffeef0', '#ff2f45', '#ffffff', '#ffc845', '#a9832c'],
    ['void', '#000000', '#0e0e0e', '#3b3b3b', '#d6d6d6', '#ffffff', '#ffffff', '#ff4a4a', '#a33030'],
    ['bacon hair', '#281c14', '#35261b', '#87684f', '#f8e9da', '#e88d3c', '#f5c28f', '#ff6060', '#a84040'],
    ['bubblegum', '#ffe6f1', '#ffd3e7', '#e39bc1', '#5b2242', '#ff4fa3', '#5b2242', '#d42a43', '#8f1c2d'],
    ['cyber city', '#0a1520', '#111f2e', '#3b5873', '#d6f4ff', '#00f0d0', '#ff3dd6', '#ff5252', '#a33535'],
    ['pirate cove', '#0f1b2c', '#16263c', '#4b6284', '#f0e7d3', '#e0a845', '#e0a845', '#ec6262', '#9c3f3f'],
    ['toxic', '#171a12', '#20251a', '#5b6545', '#dbe6c2', '#a3ff3a', '#a3ff3a', '#ff6440', '#a6402a'],
    ['space station', '#090e22', '#111936', '#444f7d', '#e6ecff', '#7da6ff', '#ffd36e', '#ff6b85', '#a6455a'],
    ['pumpkin', '#15100c', '#211913', '#6c5640', '#f7ead9', '#ff8000', '#b36bff', '#ff4040', '#a52b2b'],
    ['midnight tycoon', '#13101f', '#1c182d', '#594e7d', '#ede9ff', '#52e08b', '#52e08b', '#ff7590', '#a64c5e'],
    ['arcade', '#0d0221', '#1a0b3c', '#5c3e8c', '#fdfdfd', '#ffe600', '#ff2a6d', '#ff2a6d', '#a61a46'],
    ['blueprint', '#173563', '#1d4078', '#6f8ec2', '#eaf1ff', '#ffffff', '#ffd166', '#ff7b7b', '#b55757'],
    ['hazard', '#191919', '#232323', '#646464', '#ebebeb', '#ffcc00', '#ffcc00', '#ff5a36', '#a63b23'],
    ['sakura', '#1f1a24', '#2a2231', '#6f5b7e', '#f6eaf6', '#ff9fd0', '#ff9fd0', '#ff6b6b', '#a64545'],
    ['deep sea', '#04121b', '#082232', '#2d5b76', '#d0eeff', '#2ad6c8', '#2ad6c8', '#ff7373', '#a64a4a'],
    ['sunset strip', '#2b1a2d', '#382340', '#86617f', '#ffeada', '#ff9f6e', '#ffd36e', '#ff5c8d', '#a63c5c'],
    ['paper plane', '#f1ede4', '#e4dfd2', '#aaa294', '#3a362f', '#c2643a', '#3a362f', '#d1403a', '#8f2c28'],
    ['matcha', '#eef2e6', '#dfe7d3', '#9bab89', '#2f3a27', '#5e8c3a', '#2f3a27', '#c44b3f', '#8a342c'],
    ['terminal', '#0c0c0c', '#151915', '#3a5a3a', '#b6f5b6', '#39ff6b', '#39ff6b', '#ff5555', '#a33a3a']
  ];
  const lum = hex => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  };
  const KEYS = ['bg', 'subAlt', 'sub', 'text', 'main', 'caret', 'error', 'errorExtra'];
  const THEMES = {};
  raw.forEach(r => {
    const t = { name: r[0] };
    KEYS.forEach((k, i) => (t[k] = r[i + 1]));
    t.light = lum(t.bg) > .4;
    THEMES[r[0]] = t;
  });
  LT.THEME_KEYS = KEYS;
  LT.THEMES = THEMES;
  LT.lum = lum;
})();
