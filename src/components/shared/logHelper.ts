import { logsAPI } from '../../services/api'

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
  _adSoyad: string,
  _login: string,
  metn: string
) => {
  logsAPI.create({ Type: tip, Description: metn }).catch(() => {})
}
