export const paymentStatus = status => ({approved:'Aprobado',rejected:'Rechazado',pending:'Pendiente',in_process:'En proceso',authorized:'Autorizado, pendiente de acreditación',cancelled:'Cancelado',refunded:'Devuelto total o parcialmente',charged_back:'Contracargo',review:'Requiere revisión'}[status] ?? 'Sin información');
export function subscriptionStatus(access,now) {
  const s=access?.subscription;
  if(access?.admin)return 'Acceso administrador';
  const paid=s?.status==='active' && s.paidThrough>now;
  if(paid)return s.providerStatus==='cancelled'?'Plan activo · renovación cancelada':`Plan ${s.planId==='croquis'?'Full':'Básico'} activo`;
  if(s?.providerStatus==='pending')return 'Suscripción pendiente de pago';
  if(s?.providerStatus==='paused')return 'Suscripción pausada';
  if(s?.lastPaymentStatus==='rejected')return 'Pago rechazado · sin período pago vigente';
  if(s?.paidThrough>0)return s.providerStatus==='cancelled'?'Suscripción cancelada · período finalizado':'Suscripción vencida';
  if(s?.providerStatus==='authorized')return 'Suscripción autorizada · esperando pago aprobado';
  return access?.trialStartedAt!=null && now<access.trialStartedAt+30*86400000?'Tu prueba gratuita está activa':'Tu prueba gratuita terminó';
}
