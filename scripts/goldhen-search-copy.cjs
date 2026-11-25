'use strict';

const copy = {
  es: ['{game} para PS4 · Trucos de GoldHEN', 'Descarga el archivo JSON de trucos de GoldHEN para {game} en PS4, {id}, actualización {update}.'],
  pt: ['{game} para PS4 · Cheats do GoldHEN', 'Baixe o arquivo JSON de cheats do GoldHEN para {game} no PS4, {id}, atualização {update}.'],
  fr: ['{game} sur PS4 · Codes de triche GoldHEN', 'Téléchargez le fichier JSON de codes de triche GoldHEN pour {game} sur PS4, {id}, mise à jour {update}.'],
  de: ['{game} für PS4 · GoldHEN-Cheats', 'Lade die GoldHEN-JSON-Cheatdatei für {game} auf PS4 herunter. Titel-ID {id}, Spielupdate {update}.'],
  ru: ['{game} на PS4 · Читы GoldHEN', 'Скачайте файл читов GoldHEN в формате JSON для {game} на PS4, {id}, обновление {update}.'],
  tr: ['{game} PS4 · GoldHEN Hileleri', 'PS4 için {game} GoldHEN JSON hile dosyasını indirin. Oyun kimliği {id}, güncelleme {update}.'],
  pl: ['{game} na PS4 · Kody GoldHEN', 'Pobierz plik JSON z kodami GoldHEN do gry {game} na PS4, {id}, aktualizacja {update}.'],
  it: ['{game} per PS4 · Trucchi GoldHEN', 'Scarica il file JSON dei trucchi GoldHEN per {game} su PS4, {id}, aggiornamento {update}.'],
  zh: ['{game} PS4 版 · GoldHEN 金手指', '下载《{game}》PS4 版的 GoldHEN JSON 金手指文件。游戏 ID：{id}，更新版本：{update}。'],
  ja: ['{game} PS4版 · GoldHENチート', 'PS4版「{game}」のGoldHEN用JSONチートファイルをダウンロードできます。タイトルIDは{id}、ゲームの更新バージョンは{update}です。'],
  ko: ['{game} PS4판 · GoldHEN 치트', 'PS4판 {game}의 GoldHEN JSON 치트 파일을 다운로드하세요. 타이틀 ID는 {id}, 게임 업데이트는 {update}입니다.'],
  th: ['{game} บน PS4 · สูตรโกง GoldHEN', 'ดาวน์โหลดไฟล์สูตรโกง GoldHEN แบบ JSON สำหรับ {game} บน PS4 รหัสเกม {id} อัปเดตเกม {update}'],
  vi: ['{game} trên PS4 · Mã cheat GoldHEN', 'Tải tệp cheat JSON của GoldHEN cho {game} trên PS4, mã trò chơi {id}, bản cập nhật {update}.'],
  id: ['{game} untuk PS4 · Cheat GoldHEN', 'Unduh berkas cheat JSON GoldHEN untuk {game} di PS4, ID judul {id}, pembaruan game {update}.'],
  hi: ['{game} PS4 · GoldHEN चीट्स', 'PS4 पर {game} के लिए GoldHEN की JSON चीट फ़ाइल डाउनलोड करें। गेम आईडी {id}, अपडेट {update}।'],
  sr: ['{game} за PS4 · GoldHEN шифре', 'Преузмите JSON датотеку са GoldHEN шифрама за {game} на PS4, ознака игре {id}, ажурирање {update}.'],
  nl: ['{game} voor PS4 · GoldHEN-cheats', 'Download het JSON-cheatbestand van GoldHEN voor {game} op PS4, titel-ID {id}, game-update {update}.'],
  ka: ['{game} PS4-ზე · GoldHEN-ის ჩითები', 'ჩამოტვირთეთ GoldHEN-ის JSON ჩითების ფაილი {game}-ისთვის PS4-ზე. თამაშის ID: {id}, განახლება: {update}.'],
  ar: ['{game} على PS4 · رموز غش GoldHEN', 'نزّل ملف رموز غش GoldHEN بصيغة JSON للعبة {game} على PS4. معرّف اللعبة {id}، والتحديث {update}.'],
  he: ['{game} ל-PS4 · קודי GoldHEN', 'הורידו את קובץ קודי הצ׳יטים של GoldHEN בפורמט JSON עבור {game} ב-PS4. מזהה המשחק {id}, עדכון {update}.']
};

function localize(source, code) {
  const templates = copy[code];
  if (!templates) return undefined;
  const title = /^(.+) PS4 GoldHEN Cheats( \| whatwhatboy)?$/.exec(source);
  if (title) return templates[0].replace('{game}', () => title[1]) + (title[2] || '');

  const description = /^Download the GoldHEN JSON cheat file for (.+) on PS4, (CUSA\d{5}), game update (\d+\.\d+)\.$/.exec(source);
  if (!description) return undefined;
  const [, game, id, update] = description;
  const values = {game, id, update};
  return templates[1].replace(/\{(game|id|update)\}/g, (_, key) => values[key]);
}

module.exports = {localize};
