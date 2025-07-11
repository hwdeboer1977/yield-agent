# Yield Agent

STILL WORK IN PROGRESS

This repository contains simulation tools for analyzing and forecasting real yield opportunities on Uniswap V3 liquidity pools. The goal is to develop an AI-powered yield optimization agent that can:

- 📊 Track volume and liquidity at the **tick level**
- 🔍 Simulate hypothetical LP positions
- 💰 Estimate fee income based on real swap activity
- 🚀 Enable smarter LP strategies than naive TVL-based APYs

## Features

- ✅ Extract 24h **swap volume per tick** using historical on-chain events
- ✅ Fetch and store **liquidityGross / liquidityNet per tick** using multicall
- ✅ Calculate accurate **fee estimates** per tick using Uniswap’s math
- Much more to come!!
