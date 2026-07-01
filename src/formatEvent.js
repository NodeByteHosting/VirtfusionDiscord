const STATUS_COLORS = {
  success: 0x57f287,
  completed: 0x57f287,
  failed: 0xed4245,
  error: 0xed4245,
  pending: 0xfee75c,
  warning: 0xfee75c,
};
const DEFAULT_COLOR = 0x5865f2;

function colorFor(status) {
  return STATUS_COLORS[String(status).toLowerCase()] || DEFAULT_COLOR;
}

function getPrimaryIp(server) {
  const iface = server?.network?.interfaces?.[0];
  return iface?.ipv4?.[0]?.address || iface?.ipv6?.[0]?.address || null;
}

function serverFields(server) {
  const fields = [{ name: 'Server', value: server.name || `#${server.id}`, inline: true }];

  const ip = getPrimaryIp(server);
  if (ip) fields.push({ name: 'IP Address', value: ip, inline: true });

  if (server.hypervisor?.group?.name) {
    fields.push({ name: 'Location', value: server.hypervisor.group.name, inline: true });
  }
  if (server.owner?.email) {
    const owner = server.owner.name ? `${server.owner.name} (${server.owner.email})` : server.owner.email;
    fields.push({ name: 'Owner', value: owner, inline: true });
  }
  if (server.os?.templateName) {
    fields.push({ name: 'OS', value: server.os.templateName, inline: true });
  }
  const resources = server.settings?.resources;
  if (resources) {
    fields.push({
      name: 'Resources',
      value: `${resources.cpuCores ?? '?'} vCPU · ${resources.memory ?? '?'} MB RAM · ${resources.storage ?? '?'} GB disk`,
      inline: true,
    });
  }
  return fields;
}

function userFields(user) {
  const fields = [];
  if (user.name) fields.push({ name: 'User', value: user.name, inline: true });
  if (user.email) fields.push({ name: 'Email', value: user.email, inline: true });
  return fields;
}

function genericEmbed(payload) {
  const { event, created, controlDomain, controlName, controlSupportLink, eventStatus, data = {}, errors = [] } = payload;

  const fields = [];
  if (data.server) fields.push(...serverFields(data.server));
  if (data.user) fields.push(...userFields(data.user));

  if (Array.isArray(errors) && errors.length > 0) {
    fields.push({
      name: 'Errors',
      value: errors.map((e) => `\`${JSON.stringify(e)}\``).join('\n').slice(0, 1024),
    });
  }

  return {
    title: event,
    description: controlName ? `Event from **${controlName}**` : undefined,
    url: controlSupportLink || undefined,
    color: colorFor(eventStatus),
    fields,
    timestamp: created || new Date().toISOString(),
    footer: { text: [controlDomain, eventStatus].filter(Boolean).join(' · ') },
  };
}

function withTitle(title) {
  return (payload) => ({ ...genericEmbed(payload), title });
}

const SPECIAL_FORMATTERS = {
  'server.boot': (payload) => withTitle(`🟢 Server Booted — ${payload.data?.server?.name ?? 'unknown'}`)(payload),
  'server.build': (payload) => withTitle(`🛠️ Server Built — ${payload.data?.server?.name ?? 'unknown'}`)(payload),
  'server.suspend': (payload) => withTitle(`⏸️ Server Suspended — ${payload.data?.server?.name ?? 'unknown'}`)(payload),
  'server.delete': (payload) => withTitle(`🗑️ Server Deleted — ${payload.data?.server?.name ?? 'unknown'}`)(payload),
  'user.create': (payload) =>
    withTitle(`👤 User Created — ${payload.data?.user?.name ?? payload.data?.user?.email ?? 'unknown'}`)(payload),
};

function formatEvent(payload) {
  const handler = SPECIAL_FORMATTERS[payload.event] || genericEmbed;
  return handler(payload);
}

module.exports = { formatEvent };
