import React from "react";
import { getBurgerPriceInfo } from "../../utils/burgerPricing";
import { formatMoney } from "../../utils/formatMoney";
import { resolvePublicPath } from "../../utils/assetPath";
import BurgerNotice from "../../components/burgers/BurgerNotice";
import ProductName from "../../components/ui/ProductName";
import { MATCH_DAY_CAMPAIGN } from "../../utils/dailyFeaturePromo";
import styles from "./BurgerDelDia.module.css";

const SIZES = [
  { size: "simple", label: "Simple" },
  { size: "doble",  label: "Doble"  },
  { size: "triple", label: "Triple" },
];

export default function BurgerDelDia({ burger, weekdayLabel, eyebrow, onOpen, onAddToCart, unavailable = false, unavailableReason = "" }) {
  if (!burger) return null;

  const eyebrowText = eyebrow
    || (weekdayLabel ? `RECOMENDADA DEL ${weekdayLabel}` : "RECOMENDADA DE HOY");

  return (
    <div
      className={`${styles.wrapper} ${unavailable ? styles.wrapperUnavailable : ""}`}
      onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(e); }}
      aria-label={`Ver ${burger.name}`}>

      {/* TEMP ARGENTINA MATCH DAY: decoración festiva en las esquinas del hero. Quitar este bloque (o MATCH_DAY_CAMPAIGN=false) para revertir. */}
      {MATCH_DAY_CAMPAIGN ? (
        <div className={styles.matchDayDecor} aria-hidden="true">
          <svg className={styles.decorPennants} viewBox="0 0 400 46" preserveAspectRatio="none" width="100%" height="40">
            <path className={styles.decorString} d="M0 4 Q 100 34, 200 4 T 400 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
            {(() => {
              const n = 13;
              const flags = [];
              for (let i = 0; i < n; i++) {
                const t = i / (n - 1);
                const x = t * 400;
                const y = 4 + Math.sin(t * Math.PI) * 26 + Math.sin(t * Math.PI * 2) * 4;
                const isBlue = i % 2 === 0;
                flags.push(
                  <path
                    key={i}
                    d={`M${x - 8} ${y} L${x + 8} ${y} L${x} ${y + 15} Z`}
                    fill={isBlue ? "currentColor" : "#fff"}
                    fillOpacity={isBlue ? 1 : 0.85}
                  />
                );
              }
              return flags;
            })()}
          </svg>
          <svg className={styles.decorPennantsGhost} viewBox="0 0 400 46" preserveAspectRatio="none" width="100%" height="34">
            {(() => {
              const n = 9;
              const flags = [];
              for (let i = 0; i < n; i++) {
                const t = i / (n - 1);
                const x = t * 400;
                const y = 2 + Math.sin(t * Math.PI) * 18;
                const isBlue = i % 2 === 0;
                flags.push(
                  <path
                    key={i}
                    d={`M${x - 7} ${y} L${x + 7} ${y} L${x} ${y + 13} Z`}
                    fill={isBlue ? "currentColor" : "#fff"}
                  />
                );
              }
              return flags;
            })()}
          </svg>
        </div>
      ) : null}

      {MATCH_DAY_CAMPAIGN ? (
        <div className={styles.matchDayHead}>
          <span className={styles.matchDayBar} aria-hidden="true" />
          <p className={styles.matchDayEyebrow}>Hoy juega Argentina</p>
          <p className={styles.matchDayTitle}>
            <span className={styles.matchDayTitleWhite}>{burger.name}</span>
            <br />
            <span className={styles.matchDayTitleAccent}>para el partido</span>
          </p>
        </div>
      ) : (
        <p className={styles.eyebrow}>{eyebrowText}</p>
      )}

      {unavailable ? (
        <span className={styles.soldOutBadge}>{unavailableReason || "Sin stock"}</span>
      ) : null}

      <div className={styles.body}>
        <div className={styles.imgWrap}>
          <img
            src={resolvePublicPath(burger.img)}
            alt={burger.name}
            className={styles.img}
          />
        </div>

        <div className={styles.info}>
          {MATCH_DAY_CAMPAIGN ? null : (
            <ProductName as="h2" className={styles.name} name={burger.name} />
          )}
          {burger.notice ? <BurgerNotice notice={burger.notice} /> : null}
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
                    disabled={unavailable}
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
