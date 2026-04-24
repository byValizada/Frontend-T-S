export interface LogItem {
  id: string
  tip: 'giris' | 'tapsirig_yarat' | 'tapsirig_tamamla' | 'tapsirig_redakte' | 'tapsirig_sil' | 'elan_gonder' | 'istifadeci_yarat' | 'istifadeci_sil'
  adSoyad: string
  login: string
  metn: string
  tarix: string
}

export const addLog = (
  tip: LogItem['tip'],
  adSoyad: string,
  login: string,
  metn: string
) => {
  const data = localStorage.getItem('activityLog')
  const logs: LogItem[] = data ? JSON.parse(data) : []

  const newLog: LogItem = {
    id: Date.now().toString(),
    tip,
    adSoyad,
    login,
    metn,
    tarix: new Date().toLocaleString('az-AZ')
  }

  const updatedLogs = [...logs, newLog].slice(-200)
  localStorage.setItem('activityLog', JSON.stringify(updatedLogs))
}