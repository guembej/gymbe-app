// ==========================================================
//  Diálogos propios (sustituyen a confirm() y alert() del navegador)
//    await confirmar("¿Seguro?")        -> true / false
//    await avisar("Guardado")           -> se resuelve al aceptar
// ==========================================================

const _dlgMsj = document.getElementById("dialogo-mensaje");
const _dlgMsjTexto = document.getElementById("dialogo-mensaje-texto");
const _dlgMsjAceptar = document.getElementById("dialogo-mensaje-aceptar");
const _dlgMsjCancelar = document.getElementById("dialogo-mensaje-cancelar");

let _resolverDlg = null;

function _cerrarDlg(valor) {
  if (_resolverDlg) {
    const r = _resolverDlg;
    _resolverDlg = null;
    r(valor);
  }
  _dlgMsj.close();
}

_dlgMsjAceptar.addEventListener("click", () => _cerrarDlg(true));
_dlgMsjCancelar.addEventListener("click", () => _cerrarDlg(false));
_dlgMsj.addEventListener("cancel", (evento) => { evento.preventDefault(); _cerrarDlg(false); });

function confirmar(mensaje, opciones = {}) {
  const { aceptar = "Aceptar", cancelar = "Cancelar", peligro = false } = opciones;
  _dlgMsjTexto.textContent = mensaje;
  _dlgMsjAceptar.textContent = aceptar;
  _dlgMsjCancelar.textContent = cancelar;
  _dlgMsjCancelar.hidden = false;
  _dlgMsjAceptar.classList.toggle("peligro", peligro);
  return new Promise((res) => { _resolverDlg = res; _dlgMsj.showModal(); });
}

function avisar(mensaje, aceptar = "Entendido") {
  _dlgMsjTexto.textContent = mensaje;
  _dlgMsjAceptar.textContent = aceptar;
  _dlgMsjAceptar.classList.remove("peligro");
  _dlgMsjCancelar.hidden = true;
  return new Promise((res) => { _resolverDlg = res; _dlgMsj.showModal(); });
}
