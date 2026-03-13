# Copilot Config

| Column1                                                | Column2                                              |
| ------------------------------------------------------ | ---------------------------------------------------- |
| [User Copilot Instructions](./copilot-instructions.md) | Short, generic concepts for all projects             |
| [User Instructions](./instructions/)                   | General rules at a file type level                   |
| [User Agents](./agents/)                               | Specialised Agents for specific tasks                |
| [User Skills](./skills/)                               | A set of instructions that help with tasks/workflows |
| [User Extensions](./extensions/)                       | Think git hooks but for the agent lifecycle          |

## Prompt Tips

- goal + constraints + deliverables + approval rule, plus @ mentions for exact files. Example: `There are npm packages in @package.json which need to be updated. Only update the packages which are non-major releases. The work is only complete if all tests and lint/formatting rules pass after the packages have been updated.`

- The most optimal workflow is Research -> Plan -> Implement
  - Use `/research` for your research. Example prompt: `/research @project-d/ needs to be migrated from CircleCI to Github Actions. There are other projects in this directory which have been through the process @project-a/ , @project-b/ and @project-c/ Use those as guides to how the migration should/could be done. Go in deep and make sure you have a full understanding of the shared workflows, the approach to the migrations, the terraform changes, and anything else which is required to make the migration run as smoothly as possible.`
  - Use `shift+tab` or `/plan` for the planning. Example: `/plan Turn the research into a fully actionable plan. Make the plan suitable for fleet to be used. Ask GPT-5.3-codex and Claude Sonnet 4.6 to review the plan. The plan should not be considered ready until the reviewers approve it. Every reviewer must review in each round of reviews.`
  - Use `shift+tab` till you get to autopilot and `/fleet` for implementation, often it will recommend it to you anyway.

## Model Tips

- All models are not the same.
  - Some models are great for the research phase (GPT-5.4, Claude Sonnet/Opus, Gemini) some are not (GPT-5.3-codex)
  - Some are great at the implementation phase (GPT-5.3-codex/5.4, Claude Opus) some are not (Gemini)
- Find the model which is best suited to you or delivers the best output for you. Presently, GPT-5.4 does the best of everything for **me** but I still want other models to check it's work (alongside manual checks) prior to it's release I would use Sonnet for research & plan and then 5.3-codex for implementation.
- Reasoning doesn't always work best at the highest setting.
  - When using `/model` you can select the reasoning level for the model, the default is often the one the copilot team believes is the most optimal but you may find different. Example: GPT-5.4 default is set at `medium`, I prefer the output of `high` and find `xhigh` to make more mistakes.

## Resources

| Name                                                                                                                                       | Description                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [Anthropics Guide To Building Skills](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf?hsLang=en) | Comprehensive guide to building your own skills from the makers of Claude                                       |
| [Copilot Documentation](https://docs.github.com/en/copilot)                                                                                | Official Docs from Github, covers every aspect of Copilot (although not the 'experimental' features in the cli) |
| [Awesome Copilot](https://github.com/github/awesome-copilot)                                                                               | A collection of skills, agents, instructions from Github themselves                                             |
