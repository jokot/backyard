# VPS provider comparison for the Stage 6 server move

**Date:** 18 September 2026
**Purpose:** Choose the host for the four Hermes profiles (crazydave, peashooter, sunflower, torchwood) that Stage 6 moves off the Mac.
**Reference rate:** USD 1 = IDR 17,740.57 (18 September 2026).

---

## 1. The workload we are buying for

These are measurements from the running Mac, not estimates.

| Item | Measured value |
|---|---|
| Gateway memory, all four profiles | **158 MB RSS** (torchwood 35, peashooter 42, sunflower 45, crazydave 35) |
| Portable state to carry over | **47 MB** (4 profiles 46 MB, kanban.db 500 KB, config 52 KB) |
| Platform-bound files to reinstall | **~2.0 GB** (hermes-agent 1.1 GB, node 545 MB, bin 64 MB, lsp 63 MB) |
| Network pattern | Telegram long polling, plus outbound model API calls |
| Monthly transfer | Far less than 100 GB |

The target spec is **2 vCPU, 4 GB RAM, 40 GB disk, Ubuntu 24.04 LTS**. That is about 25 times the measured memory. The headroom exists for one reason: `peashooter` runs language servers and code tasks, and those spike. The roster at rest needs a fraction of it.

Two facts set hard limits:

- `pyproject.toml` declares `requires-python = ">=3.11,<3.14"`. Ubuntu 24.04 ships Python 3.12, so no PPA is needed.
- The Mac venv is `Mach-O 64-bit arm64` with 34 Darwin `.so` files. A plain `rsync` of `~/.hermes/` delivers a Python that cannot run on Linux. Stage 6 reinstalls instead.

---

## 2. Method, and which numbers to trust

Price pages lie less than price articles, and APIs lie less than price pages. Each figure below carries its source class.

| Class | Meaning |
|---|---|
| **API** | Read from the provider's own machine-readable price feed. Trust it. |
| **Page** | Read from the provider's own published price page today. Trust it. |
| **Derived** | Computed from an API or page figure (for example, an hourly rate times 730 hours). |
| **Estimate** | No authoritative figure was available. Treat it as a range, and confirm before you buy. |

Three providers blocked automated reads and are marked accordingly:

- Vultr returns HTTP 403 on its pricing pages. Every Vultr figure comes from `api.vultr.com/v2/plans`, which also carries per-plan region lists.
- Alibaba Cloud loads its price table in an iframe. No figure was obtained.
- IDCloudHost returns HTTP 403. Only its 2 GB tier price was confirmed from secondary sources.

Monthly figures for hourly-billed products use 730 hours. Prices exclude tax unless stated. Indonesian providers add 11% PPN at checkout.

---

## 3. International providers

All rows are 2 vCPU and 4 GB RAM unless the row says otherwise.

| Provider | Plan | Disk | Transfer | Price/month | Region for us | Source |
|---|---|---|---|---|---|---|
| **Vultr** | `vc2-2c-4gb` | 80 GB SSD | 3 TB | **$20.00** | Singapore (`sgp`) | API |
| Vultr | `vhp-2c-4gb-amd` | 100 GB NVMe | 5 TB | $24.00 | Singapore | API |
| Vultr | `vc2-2c-2gb` (2 GB) | 65 GB SSD | 3 TB | $15.00 | Singapore | API |
| DigitalOcean | Basic Regular | 80 GiB SSD | 4 TB | $24.00 | Singapore (SGP1) | Page |
| Linode / Akamai | Shared 4 GB | 80 GB SSD | 4 TB | $24.00 | Singapore | Page |
| AWS Lightsail | 4 GB bundle | 80 GB SSD | 4 TB | $24.00 | `ap-southeast-1` | Page |
| Hetzner | CPX22 | 80 GB NVMe | 1 TB | ~$29 (€26.5 excl. VAT) | Singapore (`sin`) | Page |
| **OVHcloud** | VPS-1 | 40 GB NVMe | **500 GB, then 10 Mbps** | **$4.54** | Singapore | Page |
| Hostinger | KVM 1 (1 vCPU, 4 GB) | 50 GB NVMe | 4 TB | $6.49 promo / **$11.99 renewal** | Indonesia | Page |
| Hostinger | KVM 2 (2 vCPU, 8 GB) | 100 GB NVMe | 8 TB | $8.99 promo / **$14.99 renewal** | Indonesia | Page |
| IONOS | VPS M+ | 120 GB NVMe | Unlimited | $5 promo / **$14 renewal** | **No Asian region** | Page |
| Scaleway | BASIC2-A2C-4G | Billed separately | 200 Mbps | ~€16.79 (~$19.70) | **Paris only** | Page |
| Kamatera | Pro | 20 GB + add-on | $0.01/GB | ~$40 with 40 GB | Singapore, Hong Kong | Page |
| Contabo | Cloud VPS S (4 vCPU, 8 GB) | 200 GB | 32 TB | ~$7.50 plus APAC surcharge | Surcharge at checkout | Estimate |
| Oracle Cloud | Always Free A1 (ARM) | up to 200 GB | 10 TB | **$0.00** | `ap-singapore-1` | Page |

### What each catch means

**OVHcloud is the cheapest row, and the transfer cap is why.** Unlimited traffic on OVHcloud excludes the Asia-Pacific data centers. In Singapore, VPS-1 carries 500 GB per month. After that the link drops to 10 Mbps. Our workload sends far less than 500 GB, so this cap is survivable. The $4.54 figure comes from the global price page. Asia-Pacific orders bill in SGD and can differ, so confirm the Singapore price in the order form.

**Hostinger has an Indonesia location, and the renewal price is the real price.** Every Hostinger plan bills two years upfront. The advertised $6.49 is that total divided across 24 months. The renewal is $11.99. Note also that Niagahoster now redirects to Hostinger, because Hostinger acquired it. The two names are one company.

**IONOS and Scaleway have no Asian region.** IONOS lists Europe and North America. Scaleway prices every instance in PAR-1. Both are out for a bot that answers from Jakarta.

**Kamatera bills by component.** The Pro plan gives 2 vCPU and 4 GB with 20 GB of disk. Another 20 GB costs $0.05 per GB per month, so the build lands near $40. Singapore and Hong Kong are available. Indonesia is not.

**Oracle is genuinely free, and carries three risks.** The Always Free ARM tier was halved in 2026, from 4 OCPU and 24 GB to 2 OCPU and 12 GB. 12 GB still exceeds our need by four times. The problems are structural. The home region is fixed at signup and cannot move. There is no SLA, and Oracle can reclaim idle Always Free instances. The instance is `aarch64`, and each profile carries a `bin/` and `lsp/` tree (peashooter's is 139 MB) whose Linux ARM builds are unverified. We already paid once for an architecture assumption. Do not pay twice.

---

## 4. Indonesian providers

IDR figures come from each provider's own price page. The USD column divides by 17,740.57. All exclude 11% PPN.

| Provider | Plan | vCPU | RAM | Disk | Price/month | USD | Location | Source |
|---|---|---|---|---|---|---|---|---|
| **Biznet Gio** | NEO Lite MS 4.2 | 2 | 4 GB | 60 GB SSD | **Rp139.000** | **$7.84** | Jakarta | Page |
| Biznet Gio | NEO Virtual Compute SM4.2 | 2 | 4 GB | 60 GB | Rp359.000 | $20.24 | Jakarta, multi-zone | Page |
| Biznet Gio | NEO Lite Pro MS.4.2 | 2 | 4 GB | 60 GB NVMe | Rp559.000 | $31.51 | Jakarta | Page |
| **Rumahweb** | VPS Linux L | 2 | 4 GB | 80 GB SSD | **Rp245.000** | **$13.81** | Bogor or Bekasi | Page |
| Jagoan Hosting | Nebula | 2 | 2 GB | 40 GB SSD | Rp100.000 | $5.64 | Indonesia | Page |
| Jagoan Hosting | Galaxy | 4 | 4 GB | 100 GB SSD | Rp200.000 | $11.27 | Indonesia | Page |
| Nevacloud | Nevalite 4GB | 3 | 4 GB | 60 GB NVMe | Rp237.600 | $13.39 | Jakarta (`jkt-2`) | Page |
| Nevacloud | Nevacloud NVMe 4GB | 3 | 4 GB | 60 GB NVMe | Rp316.800 | $17.86 | Jakarta | Page |
| DomaiNesia | Cloud VPS Turbo 4GB | 3 | 4 GB | 80 GB NVMe | Rp320.000 promo / **Rp640.000 renewal** | $18.04 / **$36.08** | Jakarta | Page |
| IDCloudHost | Cloud VPS Basic Standard | 2 | 2 GB | 20 GB | Rp87.000 | $4.90 | Bogor, Jakarta, Singapore | Estimate |
| IDCloudHost | 2 vCPU / 4 GB tier | 2 | 4 GB | — | Rp150.000–250.000 (unconfirmed) | $8.46–$14.09 | same | **Estimate** |

### What each catch means

**Biznet Gio NEO Lite is the cheapest exact match anywhere in this document.** Rp139.000 buys 2 cores, 4 GB, 60 GB SSD and unlimited bandwidth in Jakarta, with 24/7 local support. It is the budget line, so the disk is SSD and not NVMe. For a workload that writes a 500 KB SQLite board, that difference does not matter.

**Rumahweb offers two zones and no migration between them.** Zone A is TechnoVillage Bogor (Tier 3). Zone B is DCI Bekasi (Tier 4). The price page states that moving between zones is not available, and that an active VPS carries no refund. Choose the zone at order time.

**Three providers do not sell a 2-core 4 GB plan.** Nevacloud, DomaiNesia and Jagoan Hosting all bundle 4 GB with more cores. That is free extra capacity, not a penalty.

**DomaiNesia doubles at renewal.** Rp320.000 is a 50% promotional price. Renewal is Rp640.000, which makes it the most expensive Indonesian row.

**IDCloudHost could not be read.** The pricing page returns HTTP 403 to automated fetches. Only the 2 GB tier price is confirmed. Open the configurator manually before you rely on the 4 GB figure.

---

## 5. Hyperscalers

These are compute-only figures. Disk, snapshots, IP addresses and egress all bill separately, so the real invoice runs higher than the column.

| Provider | Instance | vCPU / RAM | Region | Compute/month | Source |
|---|---|---|---|---|---|
| AWS EC2 | `t3.medium` | 2 / 4 GB | `ap-southeast-1` Singapore | **$38.54** | API (derived) |
| AWS EC2 | `t3a.medium` | 2 / 4 GB | `ap-southeast-1` | $34.46 | API (derived) |
| AWS EC2 | `t4g.medium` (ARM) | 2 / 4 GB | `ap-southeast-1` | $30.95 | API (derived) |
| AWS EC2 | `t3.medium` | 2 / 4 GB | `ap-southeast-3` Jakarta | **$38.54** | API (derived) |
| AWS EC2 | `t4g.medium` (ARM) | 2 / 4 GB | `ap-southeast-3` Jakarta | $30.95 | API (derived) |
| Azure | `Standard_B2als_v2` | 2 / 4 GB | Indonesia Central | **$31.24** | API (derived) |
| Azure | `Standard_B2s` | 2 / 4 GB | Southeast Asia | $38.54 | API (derived) |
| Azure | `Standard_B2ms` | 2 / 8 GB | Indonesia Central | $69.35 | API (derived) |
| Google Cloud | `e2-medium` | 2 shared / 4 GB | `asia-southeast1`, `asia-southeast2` | **$34–$39** | **Estimate** |
| Alibaba Cloud | 2 vCPU / 4 GB | 2 / 4 GB | `ap-southeast-5` Jakarta | **not obtained** | — |

Two findings are worth naming.

AWS charges the same on-demand rate for `t3.medium` in Jakarta and in Singapore. The often-repeated claim that Jakarta carries a large premium does not hold for this instance family on 18 September 2026.

The Google Cloud figure is the only hyperscaler row without an authoritative source. The published band for `e2-medium` across all regions runs $0.0335 to $0.0536 per hour, and both Asian regions sit inside it. That gives $34 to $39 per month, and no tighter. Google bills `e2-medium` as separate vCPU and memory SKUs, which is why a single instance price is not published.

Every hyperscaler row costs more than Vultr and delivers less disk. They exist in this document to be ruled out, not to be chosen.

---

## 6. A correction

In Section 1 of the Stage 6 design I wrote that Hetzner "has no APAC region." That was wrong. Hetzner has run Singapore (`sin`, zone `ap-southeast`) since August 2024.

The reason to skip Hetzner is different, and worse. Hetzner repriced twice in 2026. The 1 April round was modest. The 15 June round raised the shared and dedicated vCPU lines by 113% to 175%. Singapore carries about a 1.5 times location multiplier on top. The cheap `CX` and ARM `CAX` series stay in Europe, so Singapore has no budget tier. Singapore also receives 1 TB of transfer against Europe's 20 TB, with overage near €7.40 per TB. Orders placed before 15 June keep the old price only until the next rescale.

Hetzner was the cheapest option in this class a year ago. Today it is the most expensive row in Section 3.

---

## 7. Recommendation

The workload sends and receives almost nothing on the local network. Every packet goes to the Telegram API and to the model API, and both sit outside Indonesia. **International transit quality decides this purchase, not local latency.**

That single fact reorders the tables.

### Cheapest option that still meets the bar: OVHcloud VPS-1, Singapore, $4.54/month

Confirmed on the OVHcloud Asia site on 20 September 2026. The plan gives 2 vCores, 4 GB of RAM and 40 GB of NVMe disk, which matches the target spec exactly.

- Singapore is selectable, so the transit advantage is the same as Vultr.
- OVHcloud publishes a 99.9% SLA, and includes anti-DDoS protection and a daily backup.
- The 500 GB monthly quota throttles the link to 10 Mbps. It does not stop the link. Our workload sends less than 100 GB, and 10 Mbps is about fifty times what long polling needs.
- 40 GB of disk is 19 times the 2.1 GB payload.
- The instance is x86-64, so the profile `bin/` and `lsp/` trees have known builds. That is the risk which rules out the Oracle ARM tier.

Add premium backup at $1.40 per month for a 7-day restore window. The standard backup keeps 24 hours. `kanban.db` holds the evidence under records 0044, 0048 and 0051, so the wider window is worth $1.40. Total cost is **$5.94 per month**, which saves $168.72 per year against Vultr.

Check two items in the configurator before you pay:

1. The price links carry `pricing=upfront12`. The $4.54 figure is almost certainly the 12-month prepaid rate, near $54.48 per year. The month-to-month rate is higher, and the page does not state it.
2. The price excludes GST.

The trade you accept is support. OVHcloud gives self-service support and no account manager. For a roster of four bots, that trade is correct.

### Best support and simplest path: Vultr `vc2-2c-4gb`, Singapore, $20.00/month

- The API confirms the `sgp` region for this exact plan.
- 80 GB of disk is 38 times the 2.1 GB payload.
- 3 TB of transfer is far past what long polling can consume.
- Singapore sits about 20 ms to 30 ms from WIB and holds top-tier international transit.
- It is the simplest row with a confirmed region and no transfer quota at all.

### Second choice: DigitalOcean Basic, Singapore, $24.00/month

Four dollars more buys better documentation and a calmer console. It buys no extra hardware. Choose it if you expect to read docs more than you read invoices.

### The local option, and the test it must pass first

**Biznet Gio NEO Lite MS 4.2 at Rp139.000 (~$7.84) per month** is the best value in this document on paper. It is an exact spec match, in Jakarta, with unlimited bandwidth and local support.

The open question is international transit. Indonesian providers give generous domestic bandwidth over IIX and OpenIXP. Their international routes vary. This workload is 100% international, so a weak route costs response latency on every single message.

Do not guess at this. Rent one for a month and measure it:

```
curl -o /dev/null -s -w 'connect %{time_connect}s  ttfb %{time_starttransfer}s  total %{time_total}s\n' \
  https://api.telegram.org/
curl -o /dev/null -s -w 'connect %{time_connect}s  ttfb %{time_starttransfer}s  total %{time_total}s\n' \
  https://api.anthropic.com/
mtr -rwzbc 50 api.telegram.org
```

If time to first byte to both endpoints stays under 300 ms and `mtr` shows no loss at the transit hops, Biznet Gio saves $146 per year against Vultr. If either number is poor, the $12 per month difference has bought nothing.

**Ruling for Stage 6:** the design proceeds against **OVHcloud VPS-1 in Singapore**, at $4.54 per month plus $1.40 for premium backup. It matches the target spec exactly, sits in the region that the transit argument requires, and costs 30% of the Vultr plan.

Nothing in the install order depends on the provider. A later move to Vultr or to Biznet Gio costs one more cutover, not a redesign.

### Rejected, with reasons

| Option | Why not |
|---|---|
| Oracle Always Free | No SLA, reclaimable, `aarch64` with unverified profile binaries |
| Hetzner CPX22 | Most expensive row after the June 2026 repricing |
| IONOS, Scaleway | No Asian region |
| AWS, Azure, Google Cloud | Cost more, deliver less disk, bill in parts |
| Contabo | APAC surcharge unpriced until checkout |
| DomaiNesia | Renewal doubles to Rp640.000 |
| Hostinger | Two-year upfront term, and the real price is the renewal |

---

## 8. Sources

- [Vultr plans API](https://api.vultr.com/v2/plans) — read 18 September 2026
- [DigitalOcean Droplet pricing](https://www.digitalocean.com/pricing/droplets)
- [Akamai and Linode compute pricing](https://www.linode.com/pricing/)
- [Amazon Lightsail pricing](https://aws.amazon.com/lightsail/pricing/)
- [AWS EC2 bulk price list](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/ap-southeast-1/index.csv) — read 18 September 2026
- [Azure Retail Prices API](https://prices.azure.com/api/retail/prices) — read 18 September 2026
- [Google Cloud VM instance pricing](https://cloud.google.com/compute/vm-instance-pricing)
- [Hetzner Cloud pricing](https://www.hetzner.com/cloud/)
- [Hetzner 2026 price adjustment](https://docs.hetzner.com/general/others/price-adjustment-2026/)
- [OVHcloud VPS pricing](https://www.ovhcloud.com/en/vps/)
- [OVHcloud VPS Singapore](https://www.ovhcloud.com/asia/vps/vps-singapore/)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Hostinger VPS hosting](https://www.hostinger.com/vps-hosting)
- [Hostinger server locations](https://www.hostinger.com/support/1583267-where-are-hostinger-servers-located/)
- [IONOS VPS](https://www.ionos.com/servers/vps)
- [Scaleway instance pricing](https://www.scaleway.com/en/pricing/virtual-instances/)
- [Kamatera pricing](https://www.kamatera.com/pricing/)
- [Contabo Cloud VPS](https://contabo.com/en/vps/)
- [Biznet Gio price list](https://www.biznetgio.com/en/pricelist)
- [Rumahweb VPS](https://www.rumahweb.com/vps-murah/)
- [Jagoan Hosting VPS](https://www.jagoanhosting.com/vps-murah/)
- [Nevacloud price list](https://nevacloud.com/harga/)
- [DomaiNesia VPS](https://www.domainesia.com/vps/)
- [IDCloudHost pricing](https://idcloudhost.com/pricing/)
- [Exchange rate, open.er-api.com](https://open.er-api.com/v6/latest/USD) — 18 September 2026
