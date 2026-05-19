/**
 * Qdrant Cloud free-tier cluster for Nostr RAG.
 * Applied by GitHub Actions. State stored in-repo at iac/terraform.tfstate.
 */

terraform {
  required_version = ">= 1.7.0"
  required_providers {
    qdrant-cloud = {
      source  = "qdrant/qdrant-cloud"
      version = ">= 1.1.0"
    }
  }
}

provider "qdrant-cloud" {
  api_key    = var.qdrant_cloud_api_key
  account_id = var.qdrant_cloud_account_id
}

resource "qdrant-cloud_accounts_cluster" "nostr_rag" {
  name           = "nostr-rag"
  cloud_provider = "aws"
  cloud_region   = "us-east-1"

  configuration {
    number_of_nodes = 1
    database_configuration {
      service {
        jwt_rbac = true
      }
    }
    node_configuration {
      package_id = local.free_package
    }
  }
}

resource "qdrant-cloud_accounts_database_api_key_v2" "app_key" {
  cluster_id = qdrant-cloud_accounts_cluster.nostr_rag.id
  name       = "github-actions-sync"
}

data "qdrant-cloud_booking_packages" "available" {
  cloud_provider = "aws"
  cloud_region   = "us-east-1"
}

locals {
  # Pick the cheapest free-tier package (lowest CPU + RAM)
  free_package = sort([
    for p in data.qdrant-cloud_booking_packages.available.packages : p.id
  ])[0]
}

variable "qdrant_cloud_api_key" {
  type        = string
  sensitive   = true
  description = "Qdrant Cloud Management API Key (from GitHub secret QDRANT_CLOUD_API_KEY)"
}

variable "qdrant_cloud_account_id" {
  type        = string
  description = "Qdrant Cloud Account ID (from GitHub secret QDRANT_CLOUD_ACCOUNT_ID)"
}

output "cluster_url" {
  value       = qdrant-cloud_accounts_cluster.nostr_rag.url
  description = "Qdrant cluster URL — set as QDRANT_URL GitHub secret"
}

output "cluster_id" {
  value = qdrant-cloud_accounts_cluster.nostr_rag.id
}

output "app_api_key" {
  value     = qdrant-cloud_accounts_database_api_key_v2.app_key.key
  sensitive = true
}
