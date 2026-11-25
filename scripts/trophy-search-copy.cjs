'use strict';

const english = {
  name: 'PS4 trophy unlockers',
  title: 'PS4 Trophy Unlockers & Homebrew Apps',
  description: 'Find PS4 trophy unlocker PKGs, a video guide, TrophyUnlocker for Windows, PS4PKGViewer, and PS4 homebrew apps.'
};

const copy = {
  es: ['Desbloqueadores de trofeos para PS4', 'Aplicaciones homebrew', 'Encuentra PKG para desbloquear trofeos en PS4, una guía en vídeo, TrophyUnlocker para Windows, PS4PKGViewer y aplicaciones homebrew.'],
  pt: ['Desbloqueadores de troféus para PS4', 'Aplicativos homebrew', 'Encontre PKGs para desbloquear troféus no PS4, um guia em vídeo, TrophyUnlocker para Windows, PS4PKGViewer e aplicativos homebrew.'],
  fr: ['Déblocage de trophées sur PS4', 'Applications homebrew', 'Retrouvez les PKG de déblocage de trophées PS4, un guide vidéo, TrophyUnlocker pour Windows, PS4PKGViewer et des applications homebrew.'],
  de: ['PS4-Trophäen freischalten', 'Homebrew-Apps', 'Hier findest du PS4-PKGs zum Freischalten von Trophäen, eine Videoanleitung, TrophyUnlocker für Windows, PS4PKGViewer und Homebrew-Apps.'],
  ru: ['Разблокировка трофеев PS4', 'Приложения Homebrew', 'Найдите PKG для разблокировки трофеев PS4, видеоруководство, TrophyUnlocker для Windows, PS4PKGViewer и приложения Homebrew.'],
  tr: ['PS4 kupa açma araçları', 'Homebrew uygulamaları', 'PS4 kupa açma PKG dosyalarını, video rehberini, Windows için TrophyUnlocker’ı, PS4PKGViewer’ı ve homebrew uygulamalarını bulun.'],
  pl: ['Odblokowywanie trofeów PS4', 'Aplikacje homebrew', 'Znajdź pliki PKG do odblokowywania trofeów PS4, poradnik wideo, TrophyUnlocker dla Windows, PS4PKGViewer i aplikacje homebrew.'],
  it: ['Sblocco dei trofei PS4', 'App homebrew', 'Trova i PKG per sbloccare i trofei PS4, una guida video, TrophyUnlocker per Windows, PS4PKGViewer e app homebrew.'],
  zh: ['PS4 奖杯解锁工具', '自制应用', '查找 PS4 奖杯解锁 PKG、视频教程、Windows 版 TrophyUnlocker、PS4PKGViewer 和自制应用。'],
  ja: ['PS4トロフィー解除ツール', '自作アプリ', 'PS4のトロフィー解除用PKG、動画ガイド、Windows版TrophyUnlocker、PS4PKGViewer、自作アプリが見つかります。'],
  ko: ['PS4 트로피 해제 도구', '홈브루 앱', 'PS4 트로피 해제용 PKG, 동영상 가이드, Windows용 TrophyUnlocker, PS4PKGViewer와 홈브루 앱을 찾아보세요.'],
  th: ['เครื่องมือปลดล็อกถ้วยรางวัล PS4', 'แอปโฮมบรูว์', 'ค้นหาไฟล์ PKG ปลดล็อกถ้วยรางวัล PS4 วิดีโอแนะนำ TrophyUnlocker สำหรับ Windows, PS4PKGViewer และแอปโฮมบรูว์'],
  vi: ['Công cụ mở khóa danh hiệu PS4', 'Ứng dụng homebrew', 'Tìm tệp PKG mở khóa danh hiệu PS4, video hướng dẫn, TrophyUnlocker cho Windows, PS4PKGViewer và ứng dụng homebrew.'],
  id: ['Pembuka trofi PS4', 'Aplikasi homebrew', 'Temukan PKG pembuka trofi PS4, panduan video, TrophyUnlocker untuk Windows, PS4PKGViewer, dan aplikasi homebrew.'],
  hi: ['PS4 ट्रॉफ़ी अनलॉक टूल', 'होमब्रू ऐप्स', 'PS4 ट्रॉफ़ी अनलॉक करने के लिए PKG फ़ाइलें, वीडियो गाइड, Windows के लिए TrophyUnlocker, PS4PKGViewer और होमब्रू ऐप्स खोजें।'],
  sr: ['Откључавање PS4 трофеја', 'Homebrew апликације', 'Пронађите PKG датотеке за откључавање PS4 трофеја, видео-водич, TrophyUnlocker за Windows, PS4PKGViewer и homebrew апликације.'],
  nl: ['PS4-trofeeën ontgrendelen', 'Homebrew-apps', 'Vind PKG-bestanden voor PS4-trofeeën, een videogids, TrophyUnlocker voor Windows, PS4PKGViewer en homebrew-apps.'],
  ka: ['PS4-ის ტროფეების განბლოკვა', 'Homebrew აპები', 'იპოვეთ PS4-ის ტროფეების განსაბლოკი PKG ფაილები, ვიდეოგზამკვლევი, TrophyUnlocker Windows-ისთვის, PS4PKGViewer და Homebrew აპები.'],
  ar: ['أدوات فتح جوائز PS4', 'تطبيقات Homebrew', 'اعثر على ملفات PKG لفتح جوائز PS4، ودليل فيديو، وTrophyUnlocker لنظام Windows، وPS4PKGViewer، وتطبيقات Homebrew.'],
  he: ['כלים לפתיחת גביעים ב-PS4', 'אפליקציות Homebrew', 'מצאו קובצי PKG לפתיחת גביעים ב-PS4, מדריך וידאו, TrophyUnlocker ל-Windows, ‏PS4PKGViewer ואפליקציות Homebrew.']
};

function localize(source, code) {
  const templates = copy[code];
  if (!templates) return undefined;
  const [name, apps, description] = templates;
  if (source === english.name) return name;
  if (source === english.description) return description;
  if (source === english.title) return name + ' · ' + apps;
  if (source === english.title + ' | whatwhatboy') return name + ' · ' + apps + ' | whatwhatboy';
  return undefined;
}

module.exports = {english, localize};
