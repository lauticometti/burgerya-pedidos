import React from "react";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { formatMoney } from "../../utils/formatMoney";
import { resolvePublicPath } from "../../utils/assetPath";
import styles from "./BurgerDelDia.module.css";

const SIZES = [
  { size: "simple", label: "Simple" },
  { size: "doble",  label: "Doble"  },
  { size: "triple", label: "Triple" },
];

export default function BurgerDelDia({ burger, onOpen, onAddToCart }) {
  if (!burger) return null;

  return (
    <div className={styles.wrapper} onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(e); }}
      aria-label={`Ver ${burger.name}`}>

      <p className={styles.eyebrow}>RECOMENDADA DEL DOMINGO</p>

      <div className={styles.body}>
        <div className={styles.imgWrap}>
          <img
            src={resolvePublicPath(burger.img)}
            alt={burger.name}
            className={styles.img}
          />
        </div>

        <div className={styles.info}>
          <h2 className={styles.name}>{burger.name}</h2>
          {burger.desc ? <p className={styles.desc}>{burger.desc}</p> : null}
          <p className={styles.papas}>+ papas incluidas</p>

          <div className={styles.sizeButtons}>
            {SIZES.map(({ size, label }) => {
              const info = getBurgerPriceInfo(burger, size);
              if (!info || !info.basePrice) return null;
              const isFeatured = size === "doble";
              return (
                <div key={size} className={styles.sizeBtnWrapper}>
                  {isFeatured
                    ? <span className={styles.featuredTag}>Elegí esta</span>
                    : <span className={styles.featuredTagSpacer} aria-hidden="true">&nbsp;</span>
                  }
                  <button
                    type="button"
                    className={`${styles.sizeBtn} ${isFeatured ? styles.sizeBtnFeatured : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(burger, size);
                    }}
                    aria-label={`Agregar ${burger.name} ${label} por ${formatMoney(info.finalPrice)}`}>
                    <span className={styles.sizeBtnLabel}>{label}</span>
                    {info.hasDiscount ? (
                      <span className={styles.sizeBtnPriceOriginal}>{formatMoney(info.basePrice)}</span>
                    ) : null}
                    <span className={styles.sizeBtnPrice}>{formatMoney(info.finalPrice)}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
