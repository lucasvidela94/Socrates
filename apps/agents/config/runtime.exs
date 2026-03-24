import Config

if System.get_env("PHX_SERVER") do
  config :socrates_agents, SocratesAgentsWeb.Endpoint, server: true
end

config :socrates_agents, SocratesAgentsWeb.Endpoint,
  http: [
    ip: {127, 0, 0, 1},
    port: String.to_integer(System.get_env("PORT", "4000"))
  ]

if config_env() == :prod do
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      Base.encode64(:crypto.strong_rand_bytes(48))

  config :socrates_agents, SocratesAgentsWeb.Endpoint,
    secret_key_base: secret_key_base,
    server: true
end
