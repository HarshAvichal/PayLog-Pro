import pdfParse from 'pdf-parse';

export interface Shift {
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  regHours?: number;
  ot1Hours?: number;
  department?: string;
}

export interface ParsedPayPeriod {
  startDate: string;
  endDate: string;
  shifts: Shift[];
}

export async function parsePayPeriodPDF(buffer: Buffer): Promise<ParsedPayPeriod> {
  const data = await Promise.race([
    pdfParse(buffer),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PDF parsing timeout after 30 seconds')), 30000)
    )
  ]) as any;
  
  const text = data.text;

  const shiftPattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([A-Za-z]{3}\s*\d{1,2}:\d{2}[ap]\s*[A-Z]?\s*)\s+([A-Za-z]+)\s+([A-Za-z]{3}\s*\d{1,2}:\d{2}[ap])([\d.]+)/gi;
  
  const shifts: Shift[] = [];
  let match;

    while ((match = shiftPattern.exec(text)) !== null) {
    try {
      const date = parseDate(match[1]);
      const timeInRaw = match[2]?.trim().replace(/\s+E\s*$/, '').trim() || '';
      const department = match[3]?.trim() || '';
      const timeOutRaw = match[4]?.trim() || '';
      const hoursString = match[5]?.trim() || '';
      
      const timeIn = extractTimeFromDayTime(timeInRaw);
      const timeOut = extractTimeFromDayTime(timeOutRaw);
      
      let totalHours: number;
      let regHours: number;
      let ot1Hours: number = 0;
      
      if (!hoursString) {
        continue;
      }
      
      const decimalPointCount = (hoursString.match(/\./g) || []).length;
      
      let concatMatch = hoursString.match(/^(\d+\.\d{2})(\d+\.\d{2})$/);
      
      if (!concatMatch && decimalPointCount >= 2) {
        const parts = hoursString.split('.');
        if (parts.length >= 3) {
          const firstPart = parts[0] + '.' + parts[1];
          const secondPart = parts.slice(2).join('.');
          if (firstPart.match(/^\d+\.\d{2}$/) && secondPart.match(/^\d+\.\d{2}$/)) {
            concatMatch = [hoursString, firstPart, secondPart];
          }
        }
      }
      
      if (concatMatch && decimalPointCount >= 2) {
        regHours = parseFloat(concatMatch[1]);
        ot1Hours = parseFloat(concatMatch[2]);
        totalHours = regHours + ot1Hours;
      } else {
        regHours = parseFloat(hoursString);
        if (isNaN(regHours) || regHours <= 0) {
          continue;
        }
        totalHours = regHours;
        ot1Hours = 0;
      }
      
      if (isNaN(totalHours) || isNaN(regHours) || isNaN(ot1Hours) || totalHours <= 0) {
        continue;
      }

      let shiftDate = date;
      
      const timeInDay = extractDayOfWeek(timeInRaw);
      const timeOutDay = extractDayOfWeek(timeOutRaw);
      
      if (timeInDay && timeOutDay && timeInDay !== timeOutDay) {
        shiftDate = date;
      }

      shifts.push({
        date: shiftDate,
        timeIn,
        timeOut,
        hours: totalHours,
        regHours: regHours,
        ot1Hours: ot1Hours,
        department,
      });
    } catch (error) {
    }
  }

  if (shifts.length === 0) {
    const fallbackPattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([A-Za-z]{3}\s*\d{1,2}:\d{2}[ap])\s+([A-Za-z]+)\s+([A-Za-z]{3}\s*\d{1,2}:\d{2}[ap])(?:\s+([\d.]+))?(?:\s+([\d.]+))?(?:\s+([\d.]+))?/gi;
    
    while ((match = fallbackPattern.exec(text)) !== null) {
      try {
        const date = parseDate(match[1]);
        const timeInRaw = match[2].trim();
        const department = match[3].trim();
        const timeOutRaw = match[4].trim();
        
        let totalHours: number;
        let regHours: number;
        let ot1Hours: number = 0;
        
        if (match[5]) {
          const firstStr = match[5];
          
          const decimalPointCount = (firstStr.match(/\./g) || []).length;
          
          let concatMatch = firstStr.match(/^(\d+\.\d{2})(\d+\.\d{2})$/);
          
          if (!concatMatch && decimalPointCount >= 2) {
            const flexibleMatch = firstStr.match(/^(\d+\.\d{2})(\d+\.\d{2,})$/);
            if (flexibleMatch) {
              concatMatch = flexibleMatch;
            } else {
              const parts = firstStr.split('.');
              if (parts.length >= 3) {
                const firstPart = parts[0] + '.' + parts[1];
                const secondPart = parts.slice(2).join('.');
                if (firstPart.match(/^\d+\.\d{2}$/) && secondPart.match(/^\d+\.\d{2}$/)) {
                  concatMatch = [firstStr, firstPart, secondPart];
                }
              }
            }
          }
          
          if (concatMatch && !match[6] && decimalPointCount >= 2) {
            regHours = parseFloat(concatMatch[1]);
            ot1Hours = parseFloat(concatMatch[2]);
            totalHours = regHours + ot1Hours;
          } else if (match[7]) {
            totalHours = parseFloat(match[5]);
            regHours = parseFloat(match[6]!);
            ot1Hours = parseFloat(match[7]);
          } else if (match[6]) {
            const firstNum = parseFloat(match[5]);
            const secondNum = parseFloat(match[6]);
            if (firstNum + secondNum <= 24 && firstNum > 0 && secondNum > 0) {
              totalHours = firstNum + secondNum;
              regHours = firstNum;
              ot1Hours = secondNum;
            } else {
              totalHours = firstNum;
              regHours = secondNum;
            }
          } else {
            totalHours = parseFloat(firstStr);
            regHours = totalHours;
          }
        } else {
          continue;
        }

        const timeIn = extractTimeFromDayTime(timeInRaw);
        const timeOut = extractTimeFromDayTime(timeOutRaw);

        shifts.push({
          date,
          timeIn,
          timeOut,
          hours: totalHours,
          regHours: regHours,
          ot1Hours: ot1Hours,
          department,
        });
      } catch (error) {
      }
    }
  }

  if (shifts.length === 0) {
    const flexiblePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([\d.]+\s+)?([A-Za-z]{3}\s*\d{1,2}:\d{2}[ap]\s*[A-Z]?\s*)\s+([A-Za-z]+)\s+([A-Za-z]{3}\s*\d{1,2}:\d{2}[ap])(?:\s+([\d.]+))?(?:\s+([\d.]+))?/gi;
    
    let flexibleMatch;
    while ((flexibleMatch = flexiblePattern.exec(text)) !== null && shifts.length < 20) {
      try {
        const date = parseDate(flexibleMatch[1]);
        const totalHoursStr = flexibleMatch[2]?.trim() || flexibleMatch[6]?.trim() || '0';
        const timeInRaw = flexibleMatch[3].trim().replace(/\s+[A-Z]\s*$/, '').trim();
        const department = flexibleMatch[4].trim();
        const timeOutRaw = flexibleMatch[5].trim();
        const regHoursStr = flexibleMatch[6]?.trim();
        const ot1HoursStr = flexibleMatch[7]?.trim();

        const timeIn = extractTimeFromDayTime(timeInRaw);
        const timeOut = extractTimeFromDayTime(timeOutRaw);
        
        const totalHours = parseFloat(totalHoursStr) || (parseFloat(regHoursStr || '0') + parseFloat(ot1HoursStr || '0')) || 0;
        const regHours = regHoursStr ? parseFloat(regHoursStr) : (totalHours || 0);
        const ot1Hours = ot1HoursStr ? parseFloat(ot1HoursStr) : 0;

        shifts.push({
          date,
          timeIn,
          timeOut,
          hours: totalHours || regHours + ot1Hours,
          regHours: regHours || totalHours,
          ot1Hours: ot1Hours,
          department,
        });
      } catch (error) {
      }
    }
  }

  if (shifts.length === 0) {
    throw new Error('Could not find any shifts in PDF. Please check the PDF format matches the expected timecard format.');
  }

  const shiftDateStrings = shifts.map(shift => shift.date);
  const sortedDates = [...shiftDateStrings].sort();
  
  const startDate = sortedDates[0];
  const endDate = sortedDates[sortedDates.length - 1];

  return {
    startDate,
    endDate,
    shifts,
  };
}

function parseDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  let month = parseInt(parts[0], 10);
  let day = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);

  if (year < 100) {
    year += 2000;
  }

  const date = new Date(year, month - 1, day);
  return formatDate(date);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractTimeFromDayTime(dayTimeStr: string): string {
  const cleaned = dayTimeStr.replace(/\s+[A-Z]\s*$/, '').trim();
  const match = cleaned.match(/(\d{1,2}):(\d{2})([ap])/i);
  if (!match) {
    throw new Error(`Invalid time format: ${dayTimeStr}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase() === 'P' ? 'PM' : 'AM';

  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function extractDayOfWeek(dayTimeStr: string): string | null {
  const match = dayTimeStr.match(/^([A-Za-z]{3})\s*\d/);
  return match ? match[1] : null;
}

function normalizeTime(timeStr: string): string {
  let normalized = timeStr.trim().toLowerCase();
  
  normalized = normalized.replace(/\s+/g, ' ');
  
  normalized = normalized.replace(/(\d)([ap]m?)/, '$1 $2');
  
  normalized = normalized.replace(/\b([ap])m?\b/g, (match) => {
    return match.toUpperCase().replace('M', 'M');
  });

  const match = normalized.match(/(\d{1,2}):(\d{2})\s*([AP]M)/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3];
    
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }

  return normalized;
}

function isOvernightShift(timeIn: string, timeOut: string): boolean {
  const inMinutes = timeToMinutes(timeIn);
  const outMinutes = timeToMinutes(timeOut);
  return outMinutes < inMinutes;
}

function timeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

