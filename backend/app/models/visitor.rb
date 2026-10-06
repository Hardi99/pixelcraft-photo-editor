# Un visiteur anonyme : le navigateur reçoit un jeton à la première visite et
# l'envoie ensuite dans l'en-tête Authorization. Chaque projet lui appartient.
class Visitor < ApplicationRecord
  has_secure_token :token, length: 32

  has_many :projects, dependent: :destroy
  has_many :events, dependent: :nullify
end
