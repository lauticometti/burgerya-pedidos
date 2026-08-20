// Catalogo del modal multi-seleccion de mejoras de papas. Vacio = ese modal no
// ofrece nada (hoy ademas es inalcanzable: nada llama a openExtrasModal con
// mode "papas").
//
// OJO, no confundir: la mejora "Mejorar papas" (Cheddar + Bacon) que se aplica
// desde el carrito NO sale de aca. Vive en utils/friesUpgrade.js, que es el
// unico lugar donde se configuran su contenido y su precio.
export function buildPapasMejoras() {
  return [];
}
