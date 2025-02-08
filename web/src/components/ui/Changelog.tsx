"use client";

import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion, useAnimation } from "framer-motion";
import { Icon } from "@iconify/react";
import { ParsedRelease } from "@/lib/getReleasesInfo";
import ShowMoreVersionsButton from "./ShowMoreVersionsButton";
import ViewAllReleasesLink from "./ViewAllReleasesLink";

interface ChangelogProps {
  releases: ParsedRelease[] | null;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const AnimatedRelease = ({
  release,
  index,
}: {
  release: ParsedRelease;
  index: number;
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        visible: { opacity: 1, y: 0, transition: { delay: index * 0.2 } },
        hidden: { opacity: 0, y: 50 },
      }}
      className="mb-8 bg-background/60 backdrop-blur-md border border-primary-700/20 rounded-lg p-6"
    >
      <h3 className="text-2xl font-bold text-primary-300 mb-2">
        Versión {release.version}
      </h3>
      <p className="text-sm text-primary-400 mb-4">
        {formatDate(release.date)}
      </p>
      <ul className="space-y-2">
        {release.changes.map((change: string, changeIndex: number) => (
          <motion.li
            key={changeIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: changeIndex * 0.1 }}
            className="flex items-start"
          >
            <Icon
              icon="mdi:star"
              className="text-secondary-400 mr-2 mt-1 flex-shrink-0"
            />
            <span>{change}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export const Changelog: React.FC<ChangelogProps> = ({ releases }) => {
  const [showOlderReleases, setShowOlderReleases] = useState(false);

  if (!releases || releases.length === 0) {
    return null;
  }

  const recentReleases = releases.slice(0, 3);
  const olderReleases = releases.slice(3);

  return (
    <div className="max-w-4xl mx-auto mt-16 px-4">
      <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
        Últimas Actualizaciones
      </h2>
      {recentReleases.map((release, index) => (
        <AnimatedRelease
          key={release.version}
          release={release}
          index={index}
        />
      ))}
      {olderReleases.length > 0 && (
        <div className="text-center mt-8">
          <ShowMoreVersionsButton
            showOlderReleases={showOlderReleases}
            onToggle={() => setShowOlderReleases(!showOlderReleases)}
          />
        </div>
      )}
      {showOlderReleases && (
        <div className="mt-8">
          {olderReleases.map((release, index) => (
            <AnimatedRelease
              key={release.version}
              release={release}
              index={index + 3}
            />
          ))}
        </div>
      )}
      <div className="text-center my-8">
        <ViewAllReleasesLink />
      </div>
    </div>
  );
};
