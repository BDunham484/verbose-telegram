import type { SessionConfig } from '@shared/types/index.js';

const padHour = (h: number): string => String(h).padStart(2, '0');

const sessionTime = (openHour: number, closeHour: number): string =>
  `${padHour(openHour)}00-${padHour(closeHour)}00`;

export const generatePineScript = (config: SessionConfig): string => {
  const asiaTime = sessionTime(config.asiaOpenUtcHour, config.asiaCloseUtcHour);
  const londonTime = sessionTime(config.londonOpenUtcHour, config.londonCloseUtcHour);

  return `//@version=5
indicator("Key Levels", overlay=true, max_lines_count=20)

// ─── Previous Period Levels ────────────────────────────────────────────
PDH  = request.security(syminfo.tickerid, "D", high[1],  lookahead=barmerge.lookahead_on)
PDL  = request.security(syminfo.tickerid, "D", low[1],   lookahead=barmerge.lookahead_on)
PWH  = request.security(syminfo.tickerid, "W", high[1],  lookahead=barmerge.lookahead_on)
PWL  = request.security(syminfo.tickerid, "W", low[1],   lookahead=barmerge.lookahead_on)
PMH  = request.security(syminfo.tickerid, "M", high[1],  lookahead=barmerge.lookahead_on)
PML  = request.security(syminfo.tickerid, "M", low[1],   lookahead=barmerge.lookahead_on)
DO   = request.security(syminfo.tickerid, "D", open,     lookahead=barmerge.lookahead_on)

plot(PDH, "PDH",  color=color.new(color.orange, 0),  linewidth=1, style=plot.style_line)
plot(PDL, "PDL",  color=color.new(color.orange, 0),  linewidth=1, style=plot.style_line)
plot(PWH, "PWH",  color=color.new(color.orange, 30), linewidth=1, style=plot.style_line)
plot(PWL, "PWL",  color=color.new(color.orange, 30), linewidth=1, style=plot.style_line)
plot(PMH, "PMH",  color=color.new(color.orange, 60), linewidth=1, style=plot.style_line)
plot(PML, "PML",  color=color.new(color.orange, 60), linewidth=1, style=plot.style_line)
plot(DO,  "DO",   color=color.new(color.gray,   30), linewidth=1, style=plot.style_line)

// ─── Monday High ───────────────────────────────────────────────────────
var float MON_H = na
if dayofweek == dayofweek.monday
    MON_H := high
plot(MON_H, "Mon H", color=color.new(color.gray, 0), linewidth=1, style=plot.style_line)

// ─── Asia Session (${asiaTime} UTC) ───────────────────────────────────
asiaSession = not na(time(timeframe.period, "${asiaTime}:1234567", "UTC"))
var float ASIA_O = na
var float ASIA_H = na
var float ASIA_L = na
if asiaSession and not asiaSession[1]
    ASIA_O := open
    ASIA_H := high
    ASIA_L := low
if asiaSession
    ASIA_H := math.max(nz(ASIA_H, high), high)
    ASIA_L := math.min(nz(ASIA_L, low), low)

plot(ASIA_O, "ASIA_O", color=color.new(color.blue, 0),  linewidth=1, style=plot.style_line)
plot(ASIA_H, "ASIA_H", color=color.new(color.blue, 30), linewidth=1, style=plot.style_line)
plot(ASIA_L, "ASIA_L", color=color.new(color.blue, 30), linewidth=1, style=plot.style_line)

// ─── London Session (${londonTime} UTC) ──────────────────────────────
londonSession = not na(time(timeframe.period, "${londonTime}:1234567", "UTC"))
var float LON_O = na
var float LON_H = na
var float LON_L = na
if londonSession and not londonSession[1]
    LON_O := open
    LON_H := high
    LON_L := low
if londonSession
    LON_H := math.max(nz(LON_H, high), high)
    LON_L := math.min(nz(LON_L, low), low)

plot(LON_O, "LON_O", color=color.new(color.purple, 0),  linewidth=1, style=plot.style_line)
plot(LON_H, "LON_H", color=color.new(color.purple, 30), linewidth=1, style=plot.style_line)
plot(LON_L, "LON_L", color=color.new(color.purple, 30), linewidth=1, style=plot.style_line)
`.trimStart();
};
