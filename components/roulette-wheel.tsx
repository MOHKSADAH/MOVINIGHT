"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getLocalizedMovieTitle } from "@/lib/locale";

interface CandidateMovie {
  _id: string;
  title: string;
  titleAr?: string | null;
  poster: string;
}

interface RouletteWheelProps {
  movies: CandidateMovie[];
  onPickMovie: (movieId: string) => void;
  disabled?: boolean;
}

const SECTOR_COLORS = [
  "#3f3f46",
  "#52525b",
  "#71717a",
  "#a1a1aa",
  "#4b5563",
  "#6b7280",
];

export function RouletteWheel({
  movies,
  onPickMovie,
  disabled,
}: RouletteWheelProps) {
  const locale = useLocale();
  const t = useTranslations("nights");
  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const size = 280;
  const center = size / 2;
  const radius = center - 8;

  const spin = async () => {
    if (spinning || movies.length < 2 || disabled) return;
    setSpinning(true);
    setWinnerId(null);

    const winnerIndex = Math.floor(Math.random() * movies.length);
    const sectorAngle = 360 / movies.length;
    const baseRotation = 1440;
    const targetOffset = 360 - winnerIndex * sectorAngle - sectorAngle / 2;
    const totalRotation = baseRotation + targetOffset;

    await controls.start({
      rotate: totalRotation,
      transition: {
        duration: 4.5,
        ease: [0.23, 1, 0.32, 1],
      },
    });

    setWinnerId(movies[winnerIndex]!._id);
    onPickMovie(movies[winnerIndex]!._id);
    setSpinning(false);
  };

  const getSectorPath = (index: number, total: number) => {
    if (total === 1) {
      return `M ${center} ${center} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`;
    }
    const startAngle = (2 * Math.PI * index) / total - Math.PI / 2;
    const endAngle = (2 * Math.PI * (index + 1)) / total - Math.PI / 2;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArc = 1 / total > 0.5 ? 1 : 0;
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const getLabelPos = (index: number, total: number) => {
    const angle = (2 * Math.PI * (index + 0.5)) / total - Math.PI / 2;
    const r = radius * 0.62;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle: (angle * 180) / Math.PI + 90,
    };
  };

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="text-muted-foreground text-sm">{t("rouletteEmpty")}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-3 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "18px solid hsl(var(--foreground))",
          }}
        />

        <motion.svg
          animate={controls}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transformOrigin: "center" }}
          className="drop-shadow-lg"
        >
          {movies.map((movie, i) => {
            const label = getLabelPos(i, movies.length);
            const color = SECTOR_COLORS[i % SECTOR_COLORS.length];
            const displayTitle = getLocalizedMovieTitle(movie, locale);
            const shortTitle =
              displayTitle.length > 10
                ? displayTitle.slice(0, 9) + "…"
                : displayTitle;

            return (
              <g key={movie._id}>
                <path
                  d={getSectorPath(i, movies.length)}
                  fill={color}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
                <text
                  x={label.x}
                  y={label.y}
                  fill="white"
                  fontSize={11}
                  fontWeight={600}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${label.angle}, ${label.x}, ${label.y})`}
                >
                  {shortTitle}
                </text>
              </g>
            );
          })}
          <circle
            cx={center}
            cy={center}
            r={14}
            fill="hsl(var(--background))"
            stroke="hsl(var(--border))"
            strokeWidth={2}
          />
        </motion.svg>
      </div>

      <Button
        size="lg"
        onClick={() => void spin()}
        disabled={spinning || movies.length < 2 || !!disabled}
        className="min-w-32"
      >
        {spinning ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("spinning")}
          </span>
        ) : (
          t("spinTheWheel")
        )}
      </Button>

      {winnerId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          {(() => {
            const winner = movies.find((m) => m._id === winnerId);
            if (!winner) return null;
            const winnerTitle = getLocalizedMovieTitle(winner, locale);
            return (
              <>
                <p className="text-sm text-muted-foreground font-medium">
                  {t("tonightWeWatch")}
                </p>
                <div className="flex flex-col items-center gap-2">
                  {winner.poster && winner.poster !== "/placeholder.jpg" && (
                    <div className="relative w-24 h-36 rounded-lg overflow-hidden shadow-lg">
                      <Image
                        src={winner.poster}
                        alt={winnerTitle}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  )}
                  <p className="text-lg font-bold">{winnerTitle}</p>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}
