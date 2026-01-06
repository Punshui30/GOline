/**
 * Render playbooks into ActionCards
 */

import { ActionCard, RouteDefinition } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

const PLAYBOOKS_DIR = join(process.cwd(), 'lib', 'data', 'playbooks');

export function renderPlaybook(
  routeId: string,
  facts: Record<string, string | number | boolean>
): ActionCard {
  const playbookPath = join(PLAYBOOKS_DIR, `${routeId}.md`);
  
  try {
    const content = readFileSync(playbookPath, 'utf-8');
    return parsePlaybook(content, facts);
  } catch (error) {
    console.error(`Failed to load playbook ${routeId}:`, error);
    return getFallbackActionCard();
  }
}

function parsePlaybook(content: string, facts: Record<string, any>): ActionCard {
  // Simple markdown parser for playbook format
  // Expected format:
  // # Title
  // 
  // ## Do This Today
  // - Item 1
  // - Item 2
  //
  // ## Say This
  // Script text...
  //
  // ## Bring This
  // - Item 1
  //
  // ## If They Stall
  // - Item 1
  //
  // ## Local Resources
  // - Name | Phone | Address
  //
  // ## Disclaimers
  // - Disclaimer 1

  const lines = content.split('\n');
  let currentSection = '';
  const card: Partial<ActionCard> = {
    do_today: [],
    say_this_script: '',
    bring_this: [],
    if_they_stall: [],
    local_resources: [],
    disclaimers: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('# ')) {
      card.title = line.replace(/^#+\s*/, '');
    } else if (line.startsWith('## ')) {
      const section = line.replace(/^##+\s*/, '').toLowerCase();
      if (section.includes('today')) currentSection = 'do_today';
      else if (section.includes('say')) currentSection = 'say_this';
      else if (section.includes('bring')) currentSection = 'bring_this';
      else if (section.includes('stall')) currentSection = 'if_they_stall';
      else if (section.includes('resource')) currentSection = 'resources';
      else if (section.includes('disclaim')) currentSection = 'disclaimers';
    } else if (line.startsWith('- ')) {
      const item = line.replace(/^-\s*/, '');
      if (currentSection === 'do_today' && card.do_today) {
        card.do_today.push(item);
      } else if (currentSection === 'bring_this' && card.bring_this) {
        card.bring_this.push(item);
      } else if (currentSection === 'if_they_stall' && card.if_they_stall) {
        card.if_they_stall.push(item);
      } else if (currentSection === 'disclaimers' && card.disclaimers) {
        card.disclaimers.push(item);
      } else if (currentSection === 'resources' && card.local_resources) {
        // Parse "Name | Phone | Address" format
        const parts = item.split('|').map(s => s.trim());
        card.local_resources.push({
          name: parts[0] || '',
          phone: parts[1] || undefined,
          address: parts[2] || undefined,
        });
      }
    } else if (line && currentSection === 'say_this') {
      if (card.say_this_script) {
        card.say_this_script += '\n' + line;
      } else {
        card.say_this_script = line;
      }
    }
  }

  // Replace placeholders in facts
  const template = JSON.stringify(card);
  const filled = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(facts[key] || '');
  });
  const result = JSON.parse(filled) as ActionCard;

  // Validate required fields
  if (!result.title) result.title = 'Next Steps';
  if (!result.say_this_script) result.say_this_script = 'Call the office and explain your situation.';
  if (result.do_today.length === 0) result.do_today = ['Contact the benefits office'];
  if (result.local_resources.length === 0) {
    result.local_resources = [{ name: 'Benefits Office', phone: '1-800-XXX-XXXX' }];
  }

  return result;
}

function getFallbackActionCard(): ActionCard {
  return {
    title: 'Get Help',
    do_today: [
      'Call your local benefits office',
      'Explain your situation clearly',
      'Ask what documents you need',
    ],
    say_this_script: 'Hello, I need help with my benefits. Can you help me understand what I need to do?',
    bring_this: [
      'Photo ID',
      'Any letters you received',
      'Proof of income if available',
    ],
    if_they_stall: [
      'Ask to speak to a supervisor',
      'Request a case number',
      'Ask for a timeline in writing',
    ],
    local_resources: [
      { name: 'Benefits Office', phone: '1-800-XXX-XXXX' },
    ],
    disclaimers: [
      'This is general guidance. Your situation may vary.',
    ],
  };
}















