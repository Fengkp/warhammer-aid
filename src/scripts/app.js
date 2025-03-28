function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const outputDiv = document.getElementById('output');

    if (!fileInput.files.length) {
        outputDiv.innerText = "Please select a JSON file.";
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            displayArmyList(jsonData);
        }
        catch (error) {
            outputDiv.innerText = "Invalid JSON format.";
        }
    };

    reader.readAsText(file);
}

function displayArmyList(data) {
    const outputDiv = document.getElementById('output');
    const force = data.roster.forces[0];
    const selections = force.selections.slice(3); // skip config

    const factionName = force.catalogueName || "Unknown Faction";
    const detachmentObject = force.selections[1]?.selections?.[0];
    const detachmentName = detachmentObject?.name || "Unknown Detachment";

    let html = `<h1>${factionName} - ${detachmentName}</h1>`;
    html += `<h2>Army Units</h2>`;

    selections.forEach(unit => {
        html += `<div style="border:1px solid #ccc; margin: 1em; padding: 1em; text-align:left;">`;
        html += `<h3>${unit.name} (${unit.number || 1} model${unit.number > 1 ? 's' : ''})</h3>`;

        const keywords = unit.categories?.map(cat => cat.name) || [];
        html += `<p><strong>Keywords:</strong> ${keywords.join(", ") || "None"}</p>`;

        if (unit.rules?.length) {
            html += `<p><strong>Special Rules:</strong><ul>`;
            unit.rules.forEach(rule => {
                html += `<li><strong>${rule.name}</strong>: ${rule.description}</li>`;
            });
            html += `</ul></p>`;
        }

        const abilities = unit.profiles?.filter(p => p.typeName === "Abilities") || [];
        if (abilities.length) {
            html += `<p><strong>Abilities:</strong><ul>`;
            abilities.forEach(profile => {
                const desc = profile.characteristics?.find(c => c.name === "Description")?.["$text"] || "";
                html += `<li><strong>${profile.name}</strong>: ${desc}</li>`;
            });
            html += `</ul></p>`;
        }

        const modelEntries = unit.selections?.filter(s => s.type === "model") || [];

        if (modelEntries.length > 0) {
            html += `<p><strong>Models:</strong></p>`;
            modelEntries.forEach(model => {
                html += `<div style="margin-left: 1em; padding: 0.5em;">`;
                html += `<h4>${model.name} (${model.number || 1})</h4>`;

                const statProfile = model.profiles?.find(p => p.typeName === "Unit");
                if (statProfile) {
                    html += `<p><strong>Stats:</strong> `;
                    statProfile.characteristics.forEach(c => {
                        html += `${c.name}: ${c["$text"]} `;
                    });
                    html += `</p>`;
                }

                const weapons = [];
                const weaponRules = [];

                model.selections?.forEach(weapon => {
                    weapon.profiles?.forEach(p => {
                        if (["Ranged Weapons", "Melee Weapons"].includes(p.typeName)) {
                            weapons.push({
                                name: p.name,
                                type: p.typeName,
                                characteristics: p.characteristics
                            });
                        }
                    });

                    weapon.rules?.forEach(rule => {
                        weaponRules.push({
                            name: rule.name,
                            description: rule.description
                        });
                    });
                });

                if (weapons.length > 0) {
                    html += `<p><strong>Weapons:</strong><ul>`;
                    weapons.forEach(w => {
                        html += `<li><strong>${w.name}</strong> (${w.type})<br>`;
                        html += w.characteristics.map(c => `${c.name}: ${c["$text"]}`).join(", ");
                        html += `</li>`;
                    });
                    html += `</ul></p>`;
                }

                if (weaponRules.length > 0) {
                    html += `<p><strong>Weapon Rules:</strong><ul>`;
                    weaponRules.forEach(r => {
                        html += `<li><strong>${r.name}</strong>: ${r.description}</li>`;
                    });
                    html += `</ul></p>`;
                }

                html += `</div>`;
            });
        } else {
            const statProfile = unit.profiles?.find(p => p.typeName === "Unit");
            if (statProfile) {
                html += `<p><strong>Model Stats:</strong><br>`;
                statProfile.characteristics.forEach(c => {
                    html += `${c.name}: ${c["$text"]} `;
                });
                html += `</p>`;
            }
        }

        const extraSelections = unit.selections?.filter(s =>
            s.type !== "model" &&
            !s.profiles?.some(p => ["Ranged Weapons", "Melee Weapons"].includes(p.typeName))
        ) || [];

        let extraRules = [];
        let extraAbilities = [];

        extraSelections.forEach(sel => {
            sel.rules?.forEach(rule => {
                extraRules.push({ name: rule.name, description: rule.description });
            });

            sel.profiles?.forEach(profile => {
                if (profile.typeName === "Abilities") {
                    const desc = profile.characteristics?.find(c => c.name === "Description")?.["$text"] || "";
                    extraAbilities.push({ name: profile.name, description: desc });
                }
            });
        });

        if (extraAbilities.length > 0) {
            html += `<p><strong>Additional Abilities:</strong><ul>`;
            extraAbilities.forEach(a => {
                html += `<li><strong>${a.name}</strong>: ${a.description}</li>`;
            });
            html += `</ul></p>`;
        }

        if (extraRules.length > 0) {
            html += `<p><strong>Additional Rules:</strong><ul>`;
            extraRules.forEach(r => {
                html += `<li><strong>${r.name}</strong>: ${r.description}</li>`;
            });
            html += `</ul></p>`;
        }

        html += `</div>`;
    });

    outputDiv.innerHTML = html;
}