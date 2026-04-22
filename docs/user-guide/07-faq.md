# Frequently Asked Questions (FAQ)

## General Questions

### What is Stellar Bridge Watch?

Stellar Bridge Watch is an open-source monitoring platform for cross-chain asset bridges, DEX liquidity, and bridged asset health on the Stellar network. It provides real-time analytics, automated alerts, and transparent reporting.

### Is Stellar Bridge Watch free to use?

Yes, completely free. It's an open-source project designed to serve the Stellar ecosystem.

### Do I need to create an account?

No account is required for basic monitoring features. For advanced features like custom alerts and preferences, you can connect a Stellar wallet.

### Which assets are monitored?

Currently monitoring:

- XLM (Native Stellar)
- USDC (Circle)
- PYUSD (PayPal)
- EURC (Circle Euro)
- FOBXX (Franklin Templeton)

More assets are added regularly.

## Technical Questions

### How often is data updated?

- Price data: Every 30 seconds
- Health scores: Every 5 minutes
- Bridge status: Every 5 minutes
- Liquidity data: Every 2 minutes

### Where does the data come from?

Data is aggregated from multiple sources:

- Stellar Horizon API
- Soroban RPC
- DEX APIs (StellarX, Phoenix, LumenSwap, Soroswap)
- Circle API
- Ethereum RPC (for bridge verification)

### Can I access historical data?

Yes, historical data is available for:

- Prices: 90 days
- Health scores: 90 days
- Liquidity snapshots: 90 days
- Alert events: 90 days

### Is there an API?

Yes, a public REST API is available. See the [API Documentation](../api-documentation.md) for details.

## Features Questions

### How do alerts work?

Alerts monitor specific conditions and notify you when thresholds are met. You can configure:

- Alert type (price, liquidity, health, bridge)
- Threshold values
- Notification methods (webhook, email)
- Cooldown periods

### Can I export data?

Yes, use the Export feature to download data in:

- CSV format
- JSON format
- Excel format

You can filter by date range, assets, and specific fields.

### What is a health score?

A health score (0-100) is a composite metric that evaluates:

- Liquidity depth (25%)
- Price stability (25%)
- Bridge uptime (20%)
- Reserve backing (20%)
- Volume trends (10%)

Higher scores indicate healthier assets.

### How is bridge verification done?

Bridge verification checks:

1. Supply on Stellar vs. source chain
2. Reserve backing (on-chain verification)
3. Merkle proof validation
4. Historical consistency

## Troubleshooting

### Why is data not loading?

Common solutions:

1. Check your internet connection
2. Refresh the page
3. Clear browser cache
4. Try a different browser
5. Check if the API is operational

### Why are my alerts not triggering?

Check:

1. Alert is active (not paused)
2. Threshold values are correct
3. Cooldown period hasn't been triggered recently
4. Webhook URL is valid (if using webhooks)

### Charts are not displaying correctly

Try:

1. Refresh the page
2. Zoom out/in on the chart
3. Select a different time range
4. Check browser console for errors

### Mobile app not working properly

Ensure:

1. You're using a supported browser
2. JavaScript is enabled
3. You have a stable internet connection
4. Your browser is up to date

## Privacy & Security

### What data do you collect?

We collect:

- Public blockchain data
- Anonymous usage statistics
- Alert configurations (if you create alerts)

We do NOT collect:

- Personal information
- Private keys
- Wallet balances

### Is my wallet safe?

Yes. We never request or store private keys. Wallet connections are read-only for identity purposes only.

### Can I delete my data?

Yes. If you've connected a wallet and created alerts, you can delete all your data from the Settings page.

## Contributing

### How can I contribute?

Contributions are welcome! You can:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation
- Share the project

See our [Contributing Guide](../../CONTRIBUTING.md) for details.

### I found a bug. What should I do?

1. Check if it's already reported in [GitHub Issues](https://github.com/StellaBridge/Bridge-Watch/issues)
2. If not, create a new issue with:
   - Description of the bug
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots (if applicable)

### Can I request a new feature?

Yes! Open a feature request on GitHub Issues. Include:

- Clear description of the feature
- Use case / why it's needed
- Any relevant examples or mockups

## Contact & Support

### How do I get help?

1. Check this FAQ
2. Review the [User Guide](./README.md)
3. Search [GitHub Issues](https://github.com/StellaBridge/Bridge-Watch/issues)
4. Join our community Discord
5. Open a new GitHub issue

### Is there a community?

Yes! Join our:

- Discord server
- GitHub Discussions
- Twitter/X for updates

### How do I report a security issue?

Please DO NOT open a public issue. Instead:

1. Email security@stellarbridgewatch.org
2. Include detailed description
3. We'll respond within 48 hours

---

Still have questions? [Open an issue on GitHub](https://github.com/StellaBridge/Bridge-Watch/issues) or join our Discord community.
