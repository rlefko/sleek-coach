terraform {
  backend "s3" {
    bucket         = "sleek-coach-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "sleek-coach-terraform-locks"
    encrypt        = true
  }
}
