JSON.stringify({
 ...window.petCallReview,
 humanMediaRequests:performance.getEntriesByType('resource').filter(r=>/hornbeetle-guande|audition\.m4a|stage-\d\.mp3/.test(r.name)).map(r=>r.name),
 horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
 creatureCount:document.querySelectorAll('.cinematic-beast').length,
 status:[...document.querySelectorAll('[role=status]')].map(e=>e.textContent)
});
