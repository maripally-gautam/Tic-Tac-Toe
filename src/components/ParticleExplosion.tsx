import React from "react";
import { motion } from "motion/react";

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
}

export default function ParticleExplosion() {
  // Gold, silver, and orange themed celebration sparks
  const colors = [
    "#FFD700", // Gold
    "#FFA500", // Orange
    "#C0C0C0", // Silver
    "#DAA520", // Goldenrod
    "#FF8C00", // Dark Orange
    "#FFFACD", // Lemon Chiffon / Light Gold
    "#B8860B", // Dark Goldenrod
    "#FFE4B5", // Moccasin / Champagne
  ];

  const sparks: Spark[] = Array.from({ length: 50 }, (_, idx) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 180;
    return {
      id: idx,
      x: 0,
      y: 0,
      angle,
      distance,
      color: colors[idx % colors.length],
      size: Math.random() * 8 + 3
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center overflow-visible">
      {sparks.map((spark) => {
        const destX = Math.cos(spark.angle) * spark.distance;
        const destY = Math.sin(spark.angle) * spark.distance + 80;

        return (
          <motion.div
            key={spark.id}
            initial={{ x: 0, y: 0, scale: 0.8, opacity: 1 }}
            animate={{
              x: destX,
              y: destY,
              scale: 0,
              opacity: 0,
              rotate: Math.random() * 360
            }}
            transition={{
              duration: 1.3 + Math.random() * 0.5,
              ease: [0.1, 0.8, 0.25, 1]
            }}
            style={{
              position: "absolute",
              width: spark.size,
              height: spark.size,
              backgroundColor: spark.color,
              borderRadius: spark.id % 3 === 0 ? "50%" : spark.id % 3 === 1 ? "2px" : "1px",
              boxShadow: `0 0 12px ${spark.color}, 0 0 24px ${spark.color}80`
            }}
          />
        );
      })}
    </div>
  );
}
