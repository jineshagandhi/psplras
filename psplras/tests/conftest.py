"""
Selenium Test Configuration for PSPLRAS
College Administration System - White Box & Black Box Testing
"""
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

BASE_URL = "http://localhost:3000"

@pytest.fixture(scope="session")
def driver():
    """Initialize Chrome WebDriver for the entire test session."""
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-notifications")

    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(5)
    yield driver
    driver.quit()