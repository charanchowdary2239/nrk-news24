const cron = require('node-cron');
const { getNewsSources, getSettings, updateNewsSource, isSupabaseConfigured, getDb } = require('./db');
const { fetchRssFeed } = require('./rss');
const { ingestFeedItem } = require('./ai');

let activeCronJob = null;
let isIngestionRunning = false;

/**
 * Executes a full ingestion cycle for all enabled news sources
 */
async function runIngestionTask() {
  if (isIngestionRunning) {
    console.log('[Scheduler] Ingestion cycle already in progress, skipping duplicate run.');
    return { status: 'already_running', itemsIngested: 0, sourcesProcessed: 0 };
  }

  isIngestionRunning = true;
  console.log(`[Scheduler] Starting news ingestion cycle at ${new Date().toISOString()}`);

  const db = !isSupabaseConfigured() ? getDb() : null;
  let totalIngested = 0;
  let totalSkipped = 0;
  let sourcesCount = 0;
  const errors = [];

  try {
    const allSources = await getNewsSources();
    const sources = (allSources || []).filter((s) => s.is_enabled === 1);

    for (const source of sources) {
      sourcesCount++;
      try {
        console.log(`[Scheduler] Fetching feed: ${source.name} (${source.feed_url})`);
        const feedResult = await fetchRssFeed(source.feed_url);

        for (const item of feedResult.items) {
          try {
            const res = await ingestFeedItem(db, item, source);
            if (res.skipped) {
              totalSkipped++;
            } else {
              totalIngested++;
              console.log(`[Scheduler] Imported story to Pending Review: "${res.title}"`);
            }
          } catch (itemErr) {
            console.error(`[Scheduler] Failed ingesting item "${item.title}":`, itemErr.message);
          }
        }

        // Update last fetched timestamp
        await updateNewsSource(source.id, { last_fetched_at: new Date().toISOString() });
      } catch (feedErr) {
        console.error(`[Scheduler] Error with source ${source.name}:`, feedErr.message);
        errors.push({ source: source.name, error: feedErr.message });
      }
    }
  } catch (err) {
    console.error('[Scheduler] Fatal error in ingestion task:', err);
  } finally {
    isIngestionRunning = false;
  }

  console.log(`[Scheduler] Cycle complete: ${totalIngested} new stories queued for review, ${totalSkipped} existing skipped across ${sourcesCount} sources.`);

  return {
    status: 'completed',
    itemsIngested: totalIngested,
    itemsSkipped: totalSkipped,
    sourcesProcessed: sourcesCount,
    errors,
  };
}

/**
 * Converts frequency in minutes to cron expression
 */
function minutesToCronExpression(minutes) {
  const min = parseInt(minutes, 10);
  if (min === 15) return '*/15 * * * *';
  if (min === 30) return '*/30 * * * *';
  if (min === 60) return '0 * * * *';
  if (min === 180) return '0 */3 * * *';
  if (min === 360) return '0 */6 * * *';
  return '*/30 * * * *'; // Default 30 mins
}

/**
 * Initializes or restarts the background cron scheduler based on site settings
 */
async function initCronScheduler() {
  const settings = await getSettings();

  const isEnabled = settings.cron_enabled !== 'false';
  const frequency = settings.cron_frequency ? parseInt(settings.cron_frequency, 10) : 30;

  if (activeCronJob) {
    activeCronJob.stop();
    activeCronJob = null;
  }

  if (!isEnabled) {
    console.log('[Scheduler] Cron scheduler is disabled in settings.');
    return;
  }

  const cronPattern = minutesToCronExpression(frequency);
  console.log(`[Scheduler] Initializing cron scheduler with pattern: "${cronPattern}" (every ${frequency} mins)`);

  activeCronJob = cron.schedule(cronPattern, async () => {
    console.log('[Scheduler] Cron triggered automatic news collection...');
    await runIngestionTask();
  });
}

module.exports = {
  runIngestionTask,
  initCronScheduler,
};
