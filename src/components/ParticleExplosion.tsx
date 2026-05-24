import React from "react";
import { motion } from "motion/react";

interface Spark {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
  delay: number;
}

export default function ParticleExplosion() {
  const colors = [
    "#FFD700", "#FFA500", "#C0C0C0", "#DAA520",
    "#FF8C00", "#FFFACD", "#B8860B", "#FFE4B5",
    "#FF6347", "#FF4500", "#7FFFD4", "#00CED1",
  ];

  const sparks: Spark[] = Array.from({ length: 48 }, (_, idx) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 280;
    return {
      id: idx,
      angle,
      distance,
      color: colors[idx % colors.length],
      size: Math.random() * 10 + 3,
      delay: Math.random() * 0.3,
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
      style={{ zIndex: 100 }}
    >
      {sparks.map((spark) => {
        const destX = Math.cos(spark.angle) * spark.distance;
        const destY = Math.sin(spark.angle) * spark.distance;

        return (
          <motion.div
            key={spark.id}
            initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
            animate={{
              x: destX,
              y: destY,
              scale: 0,
              opacity: 0,
              rotate: Math.random() * 720 - 360
            }}
            transition={{
              duration: 1.5 + Math.random() * 0.8,
              delay: spark.delay,
              ease: [0.1, 0.8, 0.2, 1]
            }}
            style={{
              position: "absolute",
              width: spark.size,
              height: spark.size,
              backgroundColor: spark.color,
              borderRadius: spark.id % 3 === 0 ? "50%" : spark.id % 3 === 1 ? "2px" : "0",
              boxShadow: `0 0 14px ${spark.color}, 0 0 30px ${spark.color}60`
            }}
          />
        );
      })}
    </div>
  );
}
