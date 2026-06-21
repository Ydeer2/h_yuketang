// 雨课堂 AI 学习空间 · 自动刷课脚本（2倍速 + 跳过已完成 + 强制速率保持）
(function () {
  "use strict";

  const CONFIG = {
    CHECK_INTERVAL: 3000,
    END_DELAY: 1500,
    PLAYBACK_RATE: 2,
  };

  let timer = null;
  let running = true;

  const getVideo = () => document.querySelector("video");
  const getCurrentItem = () => document.querySelector(".leaf-item.is-active");

  // 获取未完成的视频（不含对勾图标）
  const getUnfinishedVideoItems = () => {
    const all = document.querySelectorAll(".leaf-item");
    return Array.from(all).filter((el) => {
      const tag = el.querySelector(".leaf-item-tag");
      if (!tag || tag.textContent.trim() !== "视频") return false;
      const doneIcon = el.querySelector(
        ".leaf-item-right .leaf-item-status i.icon-yuanquangou",
      );
      return !doneIcon;
    });
  };

  // 播放 + 强制2倍速
  const playVideo = (video) => {
    if (!video) return false;
    // 强制设置速率
    if (video.playbackRate !== CONFIG.PLAYBACK_RATE) {
      video.playbackRate = CONFIG.PLAYBACK_RATE;
      console.log(
        `⚡ 播放速度设置为 ${CONFIG.PLAYBACK_RATE}x（当前实际速率 ${video.playbackRate}x）`,
      );
    }
    if (video.paused) {
      video.play().catch(() => {});
      return true;
    }
    return false;
  };

  // 切换到下一个未完成的视频
  const goNext = () => {
    const unfinished = getUnfinishedVideoItems();
    if (unfinished.length === 0) {
      console.log("🎉 所有视频已完成！");
      return false;
    }

    const current = getCurrentItem();
    let target = null;

    if (!current || unfinished.indexOf(current) === -1) {
      target = unfinished[0];
    } else {
      const idx = unfinished.indexOf(current);
      if (idx < unfinished.length - 1) target = unfinished[idx + 1];
      else return true; // 最后一个，等它自然结束
    }

    if (target) {
      target.click();
      console.log(
        `📺 切换到第 ${unfinished.indexOf(target) + 1}/${unfinished.length} 个未完成视频`,
      );
      // 等待视频加载后强制速率
      setTimeout(() => {
        const v = getVideo();
        if (v) playVideo(v);
      }, 500);
      return true;
    }
    return false;
  };

  // 定时检查
  const checkStatus = () => {
    if (!running) return;
    const video = getVideo();
    if (!video) return;

    // 强制保持速率
    if (video.playbackRate !== CONFIG.PLAYBACK_RATE) {
      video.playbackRate = CONFIG.PLAYBACK_RATE;
      console.log(`⚡ 重置速率 → ${CONFIG.PLAYBACK_RATE}x`);
    }

    // 暂停恢复
    if (video.paused && !video.ended) {
      console.log("⏸️ 恢复播放...");
      playVideo(video);
    }

    // 结束切换
    if (video.ended) {
      console.log("📹 当前视频结束");
      setTimeout(() => {
        if (!running) return;
        const hasNext = goNext();
        if (!hasNext) stop();
      }, CONFIG.END_DELAY);
    }
  };

  const stop = () => {
    running = false;
    if (timer) clearInterval(timer);
    timer = null;
    console.log("⏹️ 已停止");
  };

  const resume = () => {
    if (running) return;
    running = true;
    if (!timer) {
      timer = setInterval(checkStatus, CONFIG.CHECK_INTERVAL);
      console.log("▶️ 已恢复");
    }
  };

  const status = () => {
    const unfinished = getUnfinishedVideoItems();
    const current = getCurrentItem();
    const video = getVideo();
    const rate = video ? video.playbackRate : "N/A";
    console.log(`📊 剩余 ${unfinished.length} 个视频，当前速率 ${rate}x`);
    if (current) {
      const idx = unfinished.indexOf(current);
      console.log(
        `📍 当前播放第 ${idx === -1 ? "已完成" : idx + 1}/${unfinished.length}`,
      );
    }
  };

  // 初始化
  const init = () => {
    const unfinished = getUnfinishedVideoItems();
    if (unfinished.length === 0) {
      console.log("✅ 所有视频已完成，无需刷课");
      return;
    }

    console.log(`📊 发现 ${unfinished.length} 个未完成视频`);

    // 检查当前激活项
    const current = getCurrentItem();
    if (!current || unfinished.indexOf(current) === -1) {
      unfinished[0].click();
      console.log(`📺 开始播放第 1/${unfinished.length}`);
    } else {
      const idx = unfinished.indexOf(current) + 1;
      console.log(`📺 当前播放第 ${idx}/${unfinished.length}`);
    }

    // 等待视频加载后设置速率
    setTimeout(() => {
      const v = getVideo();
      if (v) playVideo(v);
    }, 800);

    // 监听视频元数据加载完成，确保速率生效
    const video = getVideo();
    if (video) {
      video.addEventListener("loadedmetadata", () => {
        if (video.playbackRate !== CONFIG.PLAYBACK_RATE) {
          video.playbackRate = CONFIG.PLAYBACK_RATE;
          console.log(`⚡ 元数据加载后设置速率 → ${CONFIG.PLAYBACK_RATE}x`);
        }
      });
      video.addEventListener("ended", () => {
        console.log("📹 ended 事件触发");
        setTimeout(() => {
          if (!running) return;
          const hasNext = goNext();
          if (!hasNext) stop();
        }, CONFIG.END_DELAY);
      });
    }

    timer = setInterval(checkStatus, CONFIG.CHECK_INTERVAL);

    console.log("✅ 自动刷课已启动（2倍速 + 跳过已完成）");
    console.log("📌 命令：autoStudy.stop() / resume() / status()");
  };

  window.autoStudy = { stop, resume, next: goNext, status };
  init();
})();
